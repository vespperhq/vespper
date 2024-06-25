.PHONY: start
start:
	docker compose up --force-recreate --remove-orphans --detach
	@echo ""
	@echo "Merlinn is running."
	@echo "Go to http://localhost:5173 for the dashboard UI."
	@echo "Go to http://localhost:3000 for the API endpoint."
	@echo "Go to https://docs.merlinn.co to learn how configure Merlinn"

.PHONY: stop
stop:
	docker compose down --remove-orphans --volumes
	@echo ""
	@echo "Merlinn is stopped."