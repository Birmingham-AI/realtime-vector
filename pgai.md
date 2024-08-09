# pgai

Bring AI models closer to your PostgreSQL data 

[https://github.com/timescale/pgai](https://github.com/timescale/pgai)


## Running the system in docker

```bash
# change to linux/amd64 if on intel/amd cpu
export DOCKER_DEFAULT_PLATFORM=linux/arm64
docker compose up -d
```

## Getting a psql shell within the timescaledb database container

If you have the psql client installed on your host, run:

```bash
psql -d "postgres://postgres:postgres@localhost:5432/changelog_db"
```

If you do NOT have the psql client installed on your host, run:

```bash
docker compose exec -it -u postgres timescaledb psql -d "changelog_db"
```

## Installing the pgai extension

The `\dx` metacommand will show you the currently installed postgres extensions.

```postgresql
\dx
```

```text
                 List of installed extensions
  Name   | Version |   Schema   |         Description          
---------+---------+------------+------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
(1 row)
```

Install the pgai extension. The pgai extension depends on pgvector and plpython3u. 
The `cascade` option automatically installs these dependencies.

```postgresql
create extension ai cascade;
\dx
```

```text
changelog_db=# create extension ai cascade;
NOTICE:  installing required extension "vector"
NOTICE:  installing required extension "plpython3u"
CREATE EXTENSION
                               List of installed extensions
    Name    | Version |   Schema   |                     Description                      
------------+---------+------------+------------------------------------------------------
 ai         | 0.3.0   | public     | helper functions for ai workflows
 plpgsql    | 1.0     | pg_catalog | PL/pgSQL procedural language
 plpython3u | 1.0     | pg_catalog | PL/Python3U untrusted procedural language
 vector     | 0.7.4   | public     | vector data type and ivfflat and hnsw access methods
(4 rows)
```

What functionality does pgai bring to postgres? The command below lists the components of the extension.

```postgresql
\dx+ ai
```

```text
                                                                                                     Object description                                                                                                     
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 function anthropic_generate(text,jsonb,integer,text,text,double precision,integer,text,text,text[],double precision,jsonb,jsonb,integer,double precision)
 function cohere_chat_complete(text,text,text,text,jsonb,text,text,jsonb,boolean,jsonb,text,double precision,integer,integer,integer,double precision,integer,text[],double precision,double precision,jsonb,jsonb,boolean)
 function cohere_classify(text,text[],text,jsonb,text)
 function cohere_classify_simple(text,text[],text,jsonb,text)
 function cohere_detokenize(text,integer[],text)
 function cohere_embed(text,text,text,text,text)
 function cohere_list_models(text,text,boolean)
 function cohere_rerank(text,text,jsonb,text,integer,boolean,integer)
 function cohere_rerank_simple(text,text,jsonb,text,integer,integer)
 function cohere_tokenize(text,text,text)
 function ollama_chat_complete(text,jsonb,text,double precision,jsonb)
 function ollama_embed(text,text,text,double precision,jsonb)
 function ollama_generate(text,text,text,bytea[],double precision,jsonb,text,text,integer[])
 function ollama_list_models(text)
 function ollama_ps(text)
 function openai_chat_complete(text,jsonb,text,double precision,jsonb,boolean,integer,integer,integer,double precision,jsonb,integer,text,double precision,double precision,jsonb,jsonb,text)
 function openai_detokenize(text,integer[])
 function openai_embed(text,integer[],text,integer,text)
 function openai_embed(text,text,text,integer,text)
 function openai_embed(text,text[],text,integer,text)
 function openai_list_models(text)
 function openai_moderate(text,text,text)
 function openai_tokenize(text,text)
(23 rows)
```

We are going to use Ollama.

## Setting up Ollama

Ollama is running in another docker container. We need to tell Ollama to pull an
LLM model that we want to use from postgres. Running `ollama pull phi3:mini` will
download the `phi3:mini` LLM model. It is roughly 3 GB, so this may take a minute,
but we only need to do it once. Once the model is downloaded to our Ollama
container we can use it at will.

```bash
docker compose exec ollama /bin/bash -c "ollama pull phi3:mini"
```

**NOTE: If you have Ollama installed on your host, and you'd rather use it 
(for performance), run `ollama pull phi3:mini` instead.**

## Pointing pgai to Ollama

Ollama is running in a separate docker container from our postgres database. 
We need to tell pgai where to send http requests meant for Ollama.

The Ollama functions in pgai will take a `_host` parameter, but that can be
tedious. By setting a postgres session variable, we can avoid having to pass
the URL in every function call.

```postgresql
select set_config('ai.ollama_host', 'http://ollama:11434', false);
```

**NOTE: If you have ollama running on your host machine and would rather use that
(it may be faster), stop the ollama container and use `http://host.docker.internal:11434`
for the `ai.ollama_host` setting in the above command.**

Let's list the models in our ollama instance.

```postgresql
select *
from ollama_list_models()
;
```

If we had not set the postgres session parameter, we could have run this instead, 
which will produce the same results.

```postgresql
select *
from ollama_list_models(_host=>'http://ollama:11434')
;
```

We should see the `llama3` model that we pulled.

```text
   name    |   model   |    size    |                              digest                              | family | format | families | parent_model | parameter_size | quantization_level |          modified_at          
-----------+-----------+------------+------------------------------------------------------------------+--------+--------+----------+--------------+----------------+--------------------+-------------------------------
 phi3:mini | phi3:mini | 2176178913 | 4f222292793889a9a40a020799cfd28d53f3e01af25d48e06c5e708610fc47e9 | phi3   | gguf   | ["phi3"] |              | 3.8B           | Q4_0               | 2024-08-09 16:39:14.597015+00
(1 row)
```

## Our dataset

List our tables

```postgresql
\dt
```

```text
           List of relations
 Schema |    Name    | Type  |  Owner   
--------+------------+-------+----------
 public | commit     | table | postgres
 public | developer  | table | postgres
 public | repository | table | postgres
(3 rows)
```

### The repository table

Describe the `repository` table

```postgresql
\d+ repository
```

```text
                                                               Table "public.repository"
   Column    |           Type           | Collation | Nullable |             Default              | Storage  | Compression | Stats target | Description 
-------------+--------------------------+-----------+----------+----------------------------------+----------+-------------+--------------+-------------
 id          | integer                  |           | not null | generated by default as identity | plain    |             |              | 
 name        | text                     |           | not null |                                  | extended |             |              | 
 description | text                     |           |          |                                  | extended |             |              | 
 created_at  | timestamp with time zone |           | not null | now()                            | plain    |             |              | 
Indexes:
    "repository_pkey" PRIMARY KEY, btree (id)
    "repository_name_key" UNIQUE CONSTRAINT, btree (name)
Referenced by:
    TABLE "commit" CONSTRAINT "commit_repository_id_fkey" FOREIGN KEY (repository_id) REFERENCES repository(id)
Access method: heap
```

### The developer table

Describe the `developer` table

```postgresql
\d+ developer
```

```text
                                                               Table "public.developer"
   Column   |           Type           | Collation | Nullable |             Default              | Storage  | Compression | Stats target | Description 
------------+--------------------------+-----------+----------+----------------------------------+----------+-------------+--------------+-------------
 id         | bigint                   |           | not null | generated by default as identity | plain    |             |              | 
 name       | text                     |           | not null |                                  | extended |             |              | 
 email      | text                     |           | not null |                                  | extended |             |              | 
 created_at | timestamp with time zone |           | not null | now()                            | plain    |             |              | 
Indexes:
    "developer_pkey" PRIMARY KEY, btree (id)
    "developer_email_key" UNIQUE CONSTRAINT, btree (email)
Referenced by:
    TABLE "commit" CONSTRAINT "commit_developer_id_fkey" FOREIGN KEY (developer_id) REFERENCES developer(id)
Access method: heap
```

### The commit table

Describe the `commit` table

```postgresql
\d+ commit
```

```text
                                                                  Table "public.commit"
    Column     |           Type           | Collation | Nullable |             Default              | Storage  | Compression | Stats target | Description 
---------------+--------------------------+-----------+----------+----------------------------------+----------+-------------+--------------+-------------
 id            | integer                  |           | not null | generated by default as identity | plain    |             |              | 
 developer_id  | integer                  |           |          |                                  | plain    |             |              | 
 repository_id | integer                  |           |          |                                  | plain    |             |              | 
 hash          | text                     |           | not null |                                  | extended |             |              | 
 message       | text                     |           | not null |                                  | extended |             |              | 
 description   | text                     |           | not null |                                  | extended |             |              | 
 commit_time   | timestamp with time zone |           | not null |                                  | plain    |             |              | 
 created_at    | timestamp with time zone |           | not null | now()                            | plain    |             |              | 
Indexes:
    "commit_pkey" PRIMARY KEY, btree (id)
    "commit_hash_key" UNIQUE CONSTRAINT, btree (hash)
Foreign-key constraints:
    "commit_developer_id_fkey" FOREIGN KEY (developer_id) REFERENCES developer(id)
    "commit_repository_id_fkey" FOREIGN KEY (repository_id) REFERENCES repository(id)
Access method: heap
```

### Sample the data

Unlike most bespoke vector databases, this is a REAL relational database.
Using pgai does not place any limitations on the SQL support inherent to PostgreSQL.

```postgresql
select
  r.name
, d.name
, c.hash
, c.message
, c.commit_time
from "commit" c
inner join developer d on (c.developer_id = d.id)
inner join repository r on (c.repository_id = r.id)
limit 10
;
```

```text
           name            |     name      |                   hash                   |                      message                      |          commit_time          
---------------------------+---------------+------------------------------------------+---------------------------------------------------+-------------------------------
 Kwik-E-Mart               | Homer Simpson | 3c1a9c61f52d92404b04134cb468653c3e244160 | Refactored codebase to follow best practices      | 2022-02-06 08:26:17.607709+00
 Springfield Elementary    | Homer Simpson | 816b0e13b8279f89a4083452f5e860e3eec455d3 | Added unit tests for new features                 | 2022-05-25 17:39:53.023563+00
 Moes Tavern               | Homer Simpson | d4b14062dc6596c58e36a15c0e8782e8e4311ed3 | Fixed typo in error messages                      | 2022-08-24 07:21:08.401683+00
 Springfield Nuclear Plant | Homer Simpson | 272457f582d5397f633c9d94dd0e68df9de7c308 | Added logging for debugging purposes              | 2023-12-08 11:43:38.381125+00
 Moes Tavern               | Homer Simpson | a2318830ba474cd4625caf0156328ec17be46929 | Improved security for data storage                | 2023-12-02 06:43:03.894866+00
 Duff Brewery              | Homer Simpson | aac86256768cf2faf457f1dd00cb87abb25b23c9 | Fixed bug in authentication logic                 | 2024-03-04 11:35:44.684429+00
 Moes Tavern               | Homer Simpson | 9955a84c5bd2254d2f187ca861fbb2fe6a31326f | Implemented new payment gateway integration       | 2022-04-04 11:09:36.809106+00
 Springfield Nuclear Plant | Homer Simpson | 4d2fc8398cd2378ac7ece7474454707230176b35 | Refactored user profile module                    | 2023-07-10 01:10:18.112865+00
 Springfield Elementary    | Homer Simpson | 3e7d5f372af3ae967151694e75edd4d28c236961 | Optimized database queries for performance        | 2024-05-10 01:33:46.645899+00
 Kwik-E-Mart               | Homer Simpson | eab8feb0ff0b0f587a3ece6cef7dfaa1af2a7b35 | Resolved compatibility issues with older browsers | 2022-11-25 04:43:13.644596+00
(10 rows)
```

## Text generation




## Semantic search

We want to do "semantic search" i.e. we want to be able to search through our
commits based on the "real-world" meaning of the data in the commits. To do this,
we need to be able to represent the "real-world" meaning somehow.

The pgvector extension provides a data type called "vector". A vector is akin to
an array of floating point values (numbers).

LLMs can take textual content and produce a vector that represents the semantic
meaning of the content as understood by the LLM. This process is called "embedding"
and the vector produced is called an "embedding".

We can store these embeddings in pgvector's vector data type.

Here is a simple example of generating an embedding using the `phi3:mini` model
running in Ollama directly from SQL using pgai:

```postgresql
select ollama_embed('phi3:mini', 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?');
```

```text
--truncated
                  ollama_embed                    
--------------------------------------------------
 [-0.5450456,0.9831866,...-0.6915562,-0.19328916]
(1 row)
```

What is the data type returned by `ollama_embed`?

```postgresql
select pg_typeof(ollama_embed('phi3:mini', 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?'));
```

```text
 pg_typeof 
-----------
 vector
(1 row)
```

How big is the vector? How many dimensions?

```postgresql
select vector_dims(ollama_embed('phi3:mini', 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?'));
```

```text
 vector_dims 
-------------
        3072
(1 row)
```


First, we need to decide what content we want to embed...

```postgresql
select
  c.id
, concat
  ( 'commit: ', c.hash, E'\n'
  , 'name: ', d.name, E'\n'
  , 'message: ', c.message, E'\n'
  , 'description: ', c.description
  ) as content
from "commit" c
inner join developer d on (c.developer_id = d.id)
;
```

We need a place to put our embeddings:

```postgresql
drop table if exists commit_embedding;
create table commit_embedding
( id int not null references "commit" (id) on delete cascade
, content text not null
, embedding vector(3072) not null
);
```

Now that we know what we want to embed and have a place to put the results,
we can use the pgai extension to generate embeddings directly from SQL in the 
database. We will take the query from above and use the `ollama_embed` function 
from pgai to generate the embeddings. The results will be stored in our 
`commit_embedding` table.

**NOTE: This will take a while. Generating embeddings is a relatively slow process.
Performance is determined by the specific model you use and your compute 
resources available to Ollama.**

```postgresql
insert into commit_embedding (id, content, embedding)
select
  x.id
, x.content
, ollama_embed('phi3:mini', x.content) -- send the content to ollama. ollama will generate and return a vector using the llama3 model
from
(
    -- we nest the same query from above
    select
      c.id
    , concat
      ( 'commit: ', c.hash, E'\n'
      , 'name: ', d.name, E'\n'
      , 'message: ', c.message, E'\n'
      , 'description: ', c.description
      ) as content
    from "commit" c
    inner join developer d on (c.developer_id = d.id)
) x
;
```

### Indexing our embeddings

pgvector provides two index types for vectors: ivfflat and hnsw.

Timescale has another open source postgres extension called pgvectorscale that
provides a third index type; StreamingDiskANN.

```postgresql
create extension vectorscale cascade;
```

```postgresql
create index on commit_embedding using diskann (embedding);
```

### Using the index




