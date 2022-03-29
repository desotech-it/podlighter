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

.PHONY: test
test:
	@$(GOCMD) test ./...

.PHONY: vtest
vtest:
	@$(GOCMD) test -v ./...

.PHONY: debug
debug:
	@$(DLVCMD) debug

node_modules:
	$(NPMCMD) install
