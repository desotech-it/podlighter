.DEFAULT_GOAL = build

REVISION = $(shell git rev-parse --short HEAD)

DLVCMD = dlv
DOCKERCMD = docker
GOCMD = go
NPMCMD = npm

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
	@$(GOCMD) test ./...

.PHONY: vtest
vtest:
	@$(GOCMD) test -v ./...

.PHONY: debug
debug:
	@$(DLVCMD) debug

.PHONY: build
build:
	$(GOCMD) build -ldflags '-s' -o podlighter

node_modules:
	$(NPMCMD) install
