.DEFAULT_GOAL = podlighter

REVISION = $(shell git rev-parse --short HEAD)
GOCMD = go
DOCKERCMD = docker

.PHONY: tidy
tidy:
	$(GOCMD) mod tidy

.PHONY: clean
clean:
	$(GOCMD) clean -x

.PHONY: docker
docker:
	# $(DOCKERCMD) image build -t podlighter -t podlighter:1 -t podlighter:"$(REVISION)" .
	$(DOCKERCMD) image build -t podlighter .

.PHONY: test
test:
	@$(GOCMD) test

.PHONY: run
run:
	@$(GOCMD) run .

podlighter:
	$(GOCMD) build -ldflags '-s' -o podlighter
