# pgai

Bring AI models closer to your PostgreSQL data

[https://github.com/timescale/pgai](https://github.com/timescale/pgai)

- Pgai is an open-source extension that brings more AI workflows to PostgreSQL,
  making it easier for developers to build search and retrieval augmented generation (RAG) applications.
- Ease of use: Create embeddings and do LLM reasoning directly within PostgreSQL.
- Supports OpenAI, Anthropic Claude, Cohere and open-source models via Ollama.

## Introduction

### whoami

**John Pruitt**

![John Pruitt](./images/jgpruitt.jpeg)

- [jgpruitt@gmail.com](mailto:jgpruitt@gmail.com)
- [www.linkedin.com/in/jgpruitt](www.linkedin.com/in/jgpruitt)
- Birmingham Native
- Staff Software Engineer at [Timescale](https://www.timescale.com/) currently working on AI products
  - pgai
  - pgvectorscale
- Formerly:
  - Application Developer
  - DBA
  - Data Architect
  - ETL Developer
  - Technical Lead
  - Engineering Manager
  - Business Owner
  - [Promscale](https://github.com/timescale/promscale) and its [extension](https://github.com/timescale/promscale_extension)

### Timescale

**[Timescale](https://www.timescale.com/) is Postgres made powerful**

3.2M+ Timescale databases power apps across IoT, sensors, AI, dev tools, crypto,
and finance—all built on PostgreSQL. We use PostgreSQL for everything; we built
our cloud so you can too

- [Cloud-hosted Postgres/Timescaledb](https://console.cloud.timescale.com/login)
- [timescaledb](https://github.com/timescale/timescaledb) - Postgres for timeseries, events, and analytics
- [pgai](https://github.com/timescale/pgai) - Postgres extension for interacting with LLMs directly from SQL
- [pgvectorscale](https://github.com/timescale/pgvectorscale) - A complement to pgvector for high performance, cost-efficient vector search on large workloads.

### What is pgai?

- An open-source postgres extension
- Written (by me!) in SQL, Python, and plpython
- Allows you to use LLM models directly from your postgres database via SQL
- Build RAG, semantic search, and AI Agents with suite of PostgreSQL extensions for AI: pgvector, pgvectorscale and pgai.
- Removes operational complexity of managing a separate vector database.
- pgvector + pgvectorscale: Fast vector search at 100M+ vector scale, with time and metadata filter capabilities
- Better Dev Experience: Multiple data type support, SQL query language, and PostgreSQL ecosystem.
- Supports:
  - OpenAI
  - Ollama
  - Anthropic
  - Cohere
  - More to come...
- Roadmap:
  - automatic embedding of database tables
  - text-to-sql
  - sql-to-text ;)
- Motivation:
  - I love SQL! ❤️
  - I hate writing "plumbing code" to move data into and out of the database. ❌
  - "Data has gravity" - don't move it any more than you have to

### The Timescale AI "stack"

**PGAI: Open-source PostgreSQL stack for AI Applications**

One database system for your AI application

![The Timescale AI stack](./images/timescale_ai_stack.png)

Tutorials, guides and explainers
https://www.timescale.com/blog/tag/ai/
https://www.timescale.com/ai

## Demo!

We are going to explore using pgai in a postgres database. We have a relational
database model containing (fake) git commits for several Simpsons-themed repos.
We will use this data + pgai + ollama to use an LLM to generate release notes
from the commits. We will do this ALL via SQL!

### Running the system in docker

You'll need Docker running on your host machine. The following command will run
a set of docker containers including our postgres database.

```bash
# change to linux/amd64 if on intel/amd cpu
export DOCKER_DEFAULT_PLATFORM=linux/arm64
docker compose up -d
```

### Getting a psql shell within the timescaledb database container

If you have the psql client installed on your host, run:

```bash
psql -d "postgres://postgres:postgres@localhost:5432/changelog_db"
```

If you do NOT have the psql client installed on your host, run:

```bash
docker compose exec -it -u postgres timescaledb psql -d "changelog_db"
```

### Installing the pgai extension

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

We are going to use [Ollama](https://ollama.com/). I think of Ollama as
"Docker for LLM models". You can use Ollama to run open-source LLM models on
your local machine. This is great for privacy and cost-savings.

### Setting up Ollama

Ollama is running in another docker container. We need to tell Ollama to pull an
LLM model that we want to use from postgres. Running `ollama pull llama3` will
download the `llama3` LLM model. It is roughly 5 GB, so this may take a minute,
but we only need to do it once. Once the model is downloaded to our Ollama
container we can use it at will.

```bash
docker compose exec ollama /bin/bash -c "ollama pull llama3"
```

**NOTE: If you have Ollama installed on your host, and you'd rather use it
(for performance), run `ollama pull llama3` instead.**

### Pointing pgai to Ollama

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
           name           |          model           |    size    |                              digest                              |  family   | format |     families      | parent_model | parameter_size | quantization_level |          modified_at
--------------------------+--------------------------+------------+------------------------------------------------------------------+-----------+--------+-------------------+--------------+----------------+--------------------+-------------------------------
 llama3:latest            | llama3:latest            | 4661224676 | 365c0bd3c000a25d28ddbf732fe1c6add414de7275464c4e4d1c3b5fcb5d8ad1 | llama     | gguf   | ["llama"]         |              | 8.0B           | Q4_0               | 2024-06-12 21:28:38.49735+00
(4 rows)
```

### Our dataset

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

#### The developer table

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

#### The commit table

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

#### Sample the data

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

### Chat completions / text generation

We can use LLMs to do chat completion directly from SQL.

```postgresql
select ollama_chat_complete
( 'llama3'
, jsonb_build_array -- array of prompts
  ( jsonb_build_object('role', 'system', 'content', 'You are a helpful assistant') -- the system prompt
  , jsonb_build_object('role', 'user', 'content', 'What is the typical weather like in Alabama in June?') -- the user prompt
  )
);
```

```text
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ollama_chat_complete
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 {"done": true, "model": "llama3", "message": {"role": "assistant", "content": "In Alabama, June is typically a warm and humid summer month with temperatures gradually increasing as the season progresses. Here's what you can expect:\n\n1. Temperatures: Daytime highs usually range from 86°F (30°C) to 92°F (33°C), while nighttime lows range from 64°F (18°C) to 70°F (21°C).\n2. Humidity: June is known for its high humidity, with an average relative humidity of 67%. This can make the temperature feel even hotter.\n3. Sunshine: Alabama receives plenty of sunshine in June, with an average of 9-10 hours of direct sunlight per day.\n4. Rainfall: June is a relatively dry month in Alabama, with an average rainfall of around 4-5 inches (10-13 cm) statewide. However, occasional thunderstorms can still occur.\n5. Storms: As the state experiences more warm and humid air from the Gulf of Mexico, thunderstorms become more frequent during this time. These storms can bring heavy rain, strong winds, and occasional tornadoes.\n\nRegional Variations:\n\n* The northern part of Alabama (e.g., Huntsville) tends to be slightly cooler than the southern regions (e.g., Mobile), with average highs in the mid-80s (29°C).\n* The central region (e.g., Birmingham) typically experiences temperatures similar to those mentioned above, while the Gulf Coast cities (e.g., Gulf Shores) tend to be warmer due to their proximity to the ocean.\n\nOverall, June is a great time to enjoy outdoor activities in Alabama, such as swimming, fishing, or hiking. Just remember to stay hydrated and take breaks in shaded areas to avoid heat exhaustion."}, "created_at": "2024-08-09T18:01:07.844742Z", "eval_count": 347, "done_reason": "stop", "eval_duration": 10403567000, "load_duration": 37575042, "total_duration": 10755150375, "prompt_eval_count": 31, "prompt_eval_duration": 311400000}
(1 row)
```

That's hard to read. Pretty print it:

```postgresql
select jsonb_pretty
(
    ollama_chat_complete
    ( 'llama3'
    , jsonb_build_array -- array of prompts
      ( jsonb_build_object('role', 'system', 'content', 'You are a helpful assistant') -- the system prompt
      , jsonb_build_object('role', 'user', 'content', 'What is the typical weather like in Alabama in June?') -- the user prompt
      )
    )
);
```

```text
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              jsonb_pretty
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     +
     "done": true,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     +
     "model": "llama3",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
     "message": {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
         "role": "assistant",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          +
         "content": "Alabama in June! Summer's in full swing, and you can expect warm and humid conditions throughout the state. Here's what you can typically expect:\n\n1. Temperatures: Daytime temperatures usually reach the mid-80s to low 90s Fahrenheit (29-32°C), while nighttime temperatures remain in the mid-60s to low 70s Fahrenheit (18-21°C).\n2. Humidity: June is one of the most humid months in Alabama, with an average relative humidity of around 67%. It can feel quite muggy and sticky!\n3. Precipitation: Expect scattered thunderstorms and showers throughout the month, with an average rainfall total of around 4-5 inches (10-13 cm) statewide.\n4. Sunshine: Despite the rain, June still sees a decent amount of sunshine, with an average of 9 hours of direct sunlight per day.\n\nSome specific regional variations to keep in mind:\n\n* The northern part of the state, including Huntsville and Decatur, tends to be slightly cooler than the southern regions like Birmingham and Montgomery.\n* Coastal areas like Mobile and Gulf Shores tend to be warmer and more humid due to their proximity to the Gulf of Mexico.\n* The mountains in northeastern Alabama, such as Lookout Mountain, can be cooler and less humid than the rest of the state.\n\nRemember to pack light, breathable clothing, and don't forget your sunscreen and insect repellent!"+
     },                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
     "created_at": "2024-08-09T18:01:43.579411Z",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
     "eval_count": 290,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +
     "done_reason": "stop",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            +
     "eval_duration": 8627621000,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +
     "load_duration": 31655875,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        +
     "total_duration": 8846530791,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     +
     "prompt_eval_count": 31,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          +
     "prompt_eval_duration": 185394000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 +
 }
(1 row)
```

What if we only what the "answer" without all the "fluff"? We can use jsonb
operators (`->` and `->>`) to pull the answer out of the jsonb object.

```postgresql
select ollama_chat_complete
( 'llama3'
, jsonb_build_array -- array of prompts
  ( jsonb_build_object('role', 'system', 'content', 'You are a helpful assistant') -- the system prompt
  , jsonb_build_object('role', 'user', 'content', 'What is the typical weather like in Alabama in June?') -- the user prompt
  )
)->'message'->>'content'
;
```

```text
                                                                                                          ?column?
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Alabama in June! That's a great time to be there!                                                                                                                                                                         +
                                                                                                                                                                                                                           +
 In June, Alabama typically experiences warm and humid weather, with temperatures gradually warming up as summer approaches. Here's what you can expect:                                                                   +
                                                                                                                                                                                                                           +
 1. Temperatures: Daytime temperatures usually reach the mid-80s to low 90s Fahrenheit (29-32°C), while nighttime temperatures range from the mid-60s to low 70s Fahrenheit (18-21°C).                                     +
 2. Humidity: June is a relatively humid month in Alabama, with an average relative humidity of around 64%. This can make the heat feel more oppressive.                                                                   +
 3. Sunshine: June sees plenty of sunshine, with an average of 9 hours of direct sunlight per day.                                                                                                                         +
 4. Rainfall: June is typically a wet month in Alabama, with an average rainfall of around 4-5 inches (10-13 cm) across the state. Expect occasional thunderstorms and heavy downpours.                                    +
                                                                                                                                                                                                                           +
 Some regional variations to note:                                                                                                                                                                                         +
                                                                                                                                                                                                                           +
 * The Gulf Coast region (e.g., Mobile and Baldwin counties) tends to be warmer and more humid than the rest of the state.                                                                                                 +
 * The Tennessee Valley region (e.g., Huntsville and Decatur) experiences slightly cooler temperatures and lower humidity than other areas.                                                                                +
 * Mountainous regions (e.g., Lookout Mountain and Cheaha State Park) tend to be cooler and less humid due to their elevation.                                                                                             +
                                                                                                                                                                                                                           +
 Overall, June is a great time to enjoy outdoor activities in Alabama, like hiking, fishing, or simply taking a stroll. Just don't forget to pack your sunscreen, sunglasses, and a light jacket for those cooler evenings!
(1 row)
```

### RAG: Generating Release Notes

We will now use a technique called "retrieval augmented generation" (RAG). We will
retrieve data from our database and use it in the prompt to the LLM.

Let's pretend I am a lazy release engineer. I am going to do a release for the
`Springfield Elementary` repository, but I am too lazy to write release notes.
Can I get an LLM to do my job for me?

```postgresql
select c.hash, c.commit_time, d.name, c.message, c.description
from "commit" c
inner join developer d on (c.developer_id = d.id)
inner join repository r on (c.repository_id = r.id)
where r.name = 'Springfield Elementary'
and c.commit_time >= '2024-01-01'::timestamptz
order by c.commit_time
limit 4
;
```

```text
                   hash                   |          commit_time          |      name       |                   message                   |                                 description
------------------------------------------+-------------------------------+-----------------+---------------------------------------------+------------------------------------------------------------------------------
 246cbab5c418e2075f50122a8ed167fcd73e5d6b | 2024-01-02 09:54:18.681702+00 | Selma Bouvier   | Enhanced UI for better user experience      | Cleaned up the codebase by removing deprecated methods and unused variables.
 36ee79ca21972c76de55ac74ce0dabc83a90a4ac | 2024-02-03 18:15:49.475783+00 | Moe Szyslak     | Updated dependencies and resolved conflicts | Fixed a typo in error messages to provide clearer feedback to users.
 fd1e78893d4b2ac780a81f885330537986d750c7 | 2024-02-12 02:20:36.956071+00 | Selma Bouvier   | Refactored user profile module              | Cleaned up the codebase by removing deprecated methods and unused variables.
 8022563bbad88b710948b2c2aa97fc5324fd3bb7 | 2024-02-13 22:29:55.911723+00 | Seymour Skinner | Added logging for debugging purposes        | Added support for new user roles, allowing for more granular access control.
(4 rows)
```

```postgresql
select count(*)
from "commit" c
inner join developer d on (c.developer_id = d.id)
inner join repository r on (c.repository_id = r.id)
where r.name = 'Springfield Elementary'
and c.commit_time >= '2024-01-01'::timestamptz
;
```

```text
 count
-------
    23
(1 row)
```

Okay, we can retrieve the commit data, but we need to feed it to our LLM in a
pure text format. Let's construct a query to do that.

```postgresql
select concat
( '* commit: ', c.hash, E'\n'
, '  date: ', c.commit_time, E'\n'
, '  author: ', d.name, ' ', d.email, E'\n'
, '  message: ', c.message, E'\n'
, '  description: ', c.description
)
from "commit" c
inner join developer d on (c.developer_id = d.id)
inner join repository r on (c.repository_id = r.id)
where r.name = 'Springfield Elementary'
order by c.commit_time
limit 3
;
```

```text
                                                   concat
------------------------------------------------------------------------------------------------------------
 * commit: a6306af9b122866bb92641b4fbdbeeab2337056d                                                        +
   date: 2022-01-10 08:50:24.868115+00                                                                     +
   author: Lisa Simpson lisa.simpson@springfield.com                                                       +
   message: Improved caching strategy for faster load times                                                +
   description: Improved the caching strategy to reduce load times and enhance performance.
 * commit: 0342509eaecb5d36de441ed740da7c550ebdfeb6                                                        +
   date: 2022-01-22 21:08:48.901178+00                                                                     +
   author: Reverend Lovejoy reverend.lovejoy@springfield.com                                               +
   message: Improved caching strategy for faster load times                                                +
   description: Resolved issues with session management to prevent user sessions from expiring prematurely.
 * commit: e968476ff03aec1fe5001134311727574bcc958d                                                        +
   date: 2022-02-20 01:00:45.133237+00                                                                     +
   author: Mayor Quimby mayor.quimby@springfield.com                                                       +
   message: Fixed bug in authentication logic                                                              +
   description: Added support for new user roles, allowing for more granular access control.
(3 rows)
```

This looks good, but it's multiple rows. We need ONE text prompt.

```postgresql
select string_agg
( x.entry
, E'\n'
) as commits
from
(
    select concat
    ( '* commit: ', c.hash, E'\n'
    , '  date: ', c.commit_time, E'\n'
    , '  author: ', d.name, ' ', d.email, E'\n'
    , '  message: ', c.message, E'\n'
    , '  description: ', c.description
    ) as entry
    from "commit" c
    inner join developer d on (c.developer_id = d.id)
    inner join repository r on (c.repository_id = r.id)
    where r.name = 'Springfield Elementary'
    order by c.commit_time
) x
;
```

```text
                                                        commits
------------------------------------------------------------------------------------------------------------------------
 * commit: a6306af9b122866bb92641b4fbdbeeab2337056d                                                                    +
   date: 2022-01-10 08:50:24.868115+00                                                                                 +
   author: Lisa Simpson lisa.simpson@springfield.com                                                                   +
   message: Improved caching strategy for faster load times                                                            +
   description: Improved the caching strategy to reduce load times and enhance performance.                            +
 * commit: 0342509eaecb5d36de441ed740da7c550ebdfeb6                                                                    +
   date: 2022-01-22 21:08:48.901178+00                                                                                 +
   author: Reverend Lovejoy reverend.lovejoy@springfield.com                                                           +
   message: Improved caching strategy for faster load times                                                            +
   description: Resolved issues with session management to prevent user sessions from expiring prematurely.            +
 * commit: e968476ff03aec1fe5001134311727574bcc958d                                                                    +
   date: 2022-02-20 01:00:45.133237+00                                                                                 +
   author: Mayor Quimby mayor.quimby@springfield.com                                                                   +
   message: Fixed bug in authentication logic                                                                          +
   description: Added support for new user roles, allowing for more granular access control.
-- truncated
(1 row)
```

Perfect! Now, we need to send this to the LLM.

```postgresql
with commits as
(
    select string_agg
    ( x.entry
    , E'\n'
    ) as commits
    from
    (
        select concat
        ( '* commit: ', c.hash, E'\n'
        , '  date: ', c.commit_time, E'\n'
        , '  author: ', d.name, ' ', d.email, E'\n'
        , '  message: ', c.message, E'\n'
        , '  description: ', c.description
        ) as entry
        from "commit" c
        inner join developer d on (c.developer_id = d.id)
        inner join repository r on (c.repository_id = r.id)
        where r.name = 'Springfield Elementary'
        order by c.commit_time
    ) x
)
select ollama_chat_complete
( 'llama3'
, jsonb_build_array -- array of prompts
  ( jsonb_build_object -- the system prompt
    ( 'role', 'system'
    , 'content', 'You are an expert software release engineer who specializes in authoring release notes.'
    )
  , jsonb_build_object -- the user prompt
    ( 'role', 'user'
    , 'content'
    , concat
      ( E'Below is a list of git commits made to the "Springfield Elementary" git repo for version 1.2.3.\n'
      , E'Write release notes in markdown format. Categorize the commits by either bug fixes, improvements, or new features.\n'
      , E'Summarize the changes. Do not simply list the commits themselves.\n'
      , E'List the authors who contributed to this release at the bottom of the document with a "thank you" message.\n'
      , E'Do not include any extra exposition other than the release notes document itself.\n'
      , commits.commits
      )
    )
  )
)->'message'->>'content'
from commits
;
```

```text
                                                       ?column?
-----------------------------------------------------------------------------------------------------------------------
 A list of commits from the "Springfield Elementary" git repository! Let me summarize the changes made by each commit:+
                                                                                                                      +
 1. **5a26f183e6811950e17b3257ef456f050ac74b14** (Lenny Leonard)                                                      +
         * Implemented new payment gateway integration                                                                +
 2. **3e7d5f372af3ae967151694e75edd4d28c236961** (Homer Simpson)                                                      +
         * Optimized database queries for performance                                                                 +
 3. **dbecd05aa74f448c7bc6b9ca71985aa006478e5e** (Patty Bouvier)                                                      +
         * Implemented new payment gateway integration                                                                +
 4. **e74e7f631a700f4499857a4f653ebc4b9a330750** (Patty Bouvier)                                                      +
         * Improved error handling in API endpoints                                                                   +
 5. **44bd9c26bb6375057f8d4121a98bbe886a593ea1** (Homer Simpson)                                                      +
         * Updated CI/CD pipeline configuration                                                                       +
 6. **e28b6b07003e4865846488d9d5f9cff0b36e4fea** (Krusty the Clown)                                                   +
         * Cleaned up code and removed deprecated methods                                                             +
 7. **29eb56357b8dfa1138e53c8fc9ad35cb95195895** (Carl Carlson)                                                       +
         * Refactored user profile module                                                                             +
 8. **d6aed20c33f3e35339240aed8505124518815e1a** (Ned Flanders)                                                       +
         * Improved error handling in API endpoints                                                                   +
 9. **1ef94a0f80f7826c2645fc8d92782ac60a14e2ab** (Carl Carlson)                                                       +
         * Improved security for data storage                                                                         +
 10. **127960e928f9aeb379521e094303347cb7348a27** (Marge Simpson)                                                     +
         * Updated API responses for consistency                                                                      +
 11. **9e2e556304e353630bce9933bf1fe2c9eeeed657** (Krusty the Clown)                                                  +
         * Updated API responses for consistency                                                                      +
                                                                                                                      +
 Some notable changes include:                                                                                        +
                                                                                                                      +
 * Multiple commits improving error handling and performance                                                          +
 * Implementation of a new payment gateway integration                                                                +
 * Refactoring of the user profile module and data storage security improvements                                      +
 * Consistency updates to API responses
(1 row)
```

**NOTE: You are likely to get a different answer each time you run the query.
Different LLM models may produce better or worse results. Experimentation with
the models and prompts is key.**

## Further exploration

We have just scratched the surface of what you can do in postgres for AI workloads.
There is so much more to pgai and postgres as a vector database. Check out some of
the content below I have contributed to for further exploration.

- [Build search and RAG systems on PostgreSQL using Cohere and pgai](https://www.timescale.com/blog/build-search-and-rag-systems-on-postgresql-using-cohere-and-pgai/)
- [Use Anthropic Claude Sonnet 3.5 in PostgreSQL With Pgai](https://www.timescale.com/blog/use-anthropic-claude-sonnet-3-5-in-postgresql-with-pgai/)
- [Use Open-Source LLMs in PostgreSQL With Ollama and Pgai](https://www.timescale.com/blog/use-open-source-llms-in-postgresql-with-ollama-and-pgai/)
- [PostgreSQL and Pgvector: Now Faster Than Pinecone, 75% Cheaper, and 100% Open Source](https://www.timescale.com/blog/pgvector-is-now-as-fast-as-pinecone-at-75-less-cost/)
- [Making PostgreSQL a Better AI Database](https://www.timescale.com/blog/making-postgresql-a-better-ai-database/)
- [Pgvector vs. Pinecone: Vector Database Performance and Cost Comparison](https://www.timescale.com/blog/pgvector-vs-pinecone/)
- [Pgai: Giving PostgreSQL Developers AI Engineering Superpowers](https://www.timescale.com/blog/pgai-giving-postgresql-developers-ai-engineering-superpowers/)
- [Refining Vector Search Queries With Time Filters in Pgvector: A Tutorial](https://www.timescale.com/blog/refining-vector-search-queries-with-time-filters-in-pgvector-a-tutorial/)
- [PostgresFM ep.101 pgvectorscale](https://www.youtube.com/live/dX6xbManLZw?si=5EZXUVYPplYxdqf8)
- [pgvector and Timescale Vector: Up and Running with PostgreSQL as a Vector Database](https://youtu.be/JDVU0k30cGA?si=642rYfinR_PHzG8y)
