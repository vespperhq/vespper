echo "Creating vespper directory"
mkdir -p vespper/config/litellm
mkdir -p vespper/config/kratos
mkdir -p vespper/config/postgres

test -e vespper

# Change directory to vespper
cd vespper

which curl &> /dev/null || echo "curl is not installed. Please install curl and try again."

curl https://raw.githubusercontent.com/vespper/vespper/main/.env.example --output .env

# LiteLLM config
curl https://raw.githubusercontent.com/vespper/vespper/main/config/litellm/.env.example --output config/litellm/.env
curl https://raw.githubusercontent.com/vespper/vespper/main/config/litellm/config.example.yaml --output config/litellm/config.yaml

# Kratos config
curl https://raw.githubusercontent.com/vespper/vespper/main/config/kratos/identity.schema.json --output config/kratos/identity.schema.json
curl https://raw.githubusercontent.com/vespper/vespper/main/config/kratos/kratos.yml --output config/kratos/kratos.yml
curl https://raw.githubusercontent.com/vespper/vespper/main/config/kratos/webhook_payload.jsonnet --output config/kratos/webhook_payload.jsonnet

# Postgres config
curl https://raw.githubusercontent.com/vespper/vespper/main/config/postgres/postgres_init.sh --output config/postgres/postgres_init.sh

chmod +x config/postgres/postgres_init.sh
