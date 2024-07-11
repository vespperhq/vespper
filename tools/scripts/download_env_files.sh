echo "Creating merlinn directory"
mkdir -p merlinn/config/litellm
mkdir -p merlinn/config/kratos
mkdir -p merlinn/config/postgres

test -e merlinn

# Change directory to merlinn
cd merlinn

which curl &> /dev/null || echo "curl is not installed. Please install curl and try again."

curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/.env.example --output .env

# LiteLLM config
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/config/litellm/.env.example --output config/litellm/.env
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/config/litellm/config.example.yaml --output config/litellm/config.yaml

# Kratos config
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/config/kratos/identity.schema.json --output config/kratos/identity.schema.json
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/config/kratos/kratos.yml --output config/kratos/kratos.yml
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/config/kratos/webhook_payload.jsonnet --output config/kratos/webhook_payload.jsonnet

# Postgres config
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/config/postgres/postgres_init.sh --output config/postgres/postgres_init.sh

