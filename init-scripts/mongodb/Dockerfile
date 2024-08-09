FROM mongo

COPY pull_requests_seed.json /pull_requests_seed.json
COPY commits_seed.json /commits_seed.json
COPY developers_seed.json /developers_seed.json
COPY repositories_seed.json /repositories_seed.json

CMD mongoimport --host mongodb --db github_proxy --collection pull_requests --type json --file /pull_requests_seed.json --jsonArray && \
    mongoimport --host mongodb --db github_proxy --collection commits --type json --file /commits_seed.json --jsonArray && \
    mongoimport --host mongodb --db github_proxy --collection developers --type json --file /developers_seed.json --jsonArray && \
    mongoimport --host mongodb --db github_proxy --collection repositories --type json --file /repositories_seed.json --jsonArray
