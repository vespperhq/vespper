echo "Creating vespper directory"
mkdir -p vespper
test -e vespper

# Change directory to vespper
cd vespper

which curl &> /dev/null || echo "curl is not installed. Please install curl and try again."

curl https://raw.githubusercontent.com/vespper/vespper/main/docker-compose.common.yml --output docker-compose.common.yml
curl https://raw.githubusercontent.com/vespper/vespper/main/docker-compose.images.yml --output docker-compose.yml

docker compose up -d
