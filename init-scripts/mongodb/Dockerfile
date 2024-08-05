FROM mongo

COPY pull_requests.json /pull_requests.json
CMD mongoimport --host mongodb --db github_proxy --collection pull_requests --type json --file /pull_requests.json --jsonArray
