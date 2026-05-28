echo "Starting Docker Containers in Prod Mode"
docker compose up -d web airflow-webserver airflow-scheduler airflow-init worker rabbitmq prometheus grafana
