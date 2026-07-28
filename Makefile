.PHONY: init start stop restart pkill reload

init:
	mkdir -p base base/.log base/.pid

start: init
	@echo "Starting backend..."
	nohup poetry run python src/deployment/backend/manage.py runserver 0.0.0.0:8000 > base/.log/backend.log 2>&1 & echo $$! > base/.pid/backend.pid
	@echo "Starting frontend..."
	nohup npm --prefix src/deployment/frontend run dev -- --host 0.0.0.0 > base/.log/frontend.log 2>&1 & echo $$! > base/.pid/frontend.pid
	@echo "Services started."

stop:
	@echo "Stopping services via pid..."
	-@if [ -f base/.pid/backend.pid ]; then kill $$(cat base/.pid/backend.pid) 2>/dev/null && rm -f base/.pid/backend.pid || true; fi
	-@if [ -f base/.pid/frontend.pid ]; then kill $$(cat base/.pid/frontend.pid) 2>/dev/null && rm -f base/.pid/frontend.pid || true; fi
	@echo "Services stopped."

pkill:
	@echo "Force stopping services via pkill..."
	-pkill -f "manage.py runserver" || true
	-pkill -f "vite" || true
	-rm -f base/.pid/backend.pid base/.pid/frontend.pid
	@echo "Services force killed."

restart: stop start

reload: restart
