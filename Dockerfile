FROM golang:1.18-bullseye AS golang
WORKDIR /usr/local/src/podlighter
COPY . .
RUN ["go", "build", "-ldflags", "-s -w", "-o", "podlighter"]

FROM node:16-bullseye AS node
WORKDIR /usr/local/src/podlighter
COPY . .
RUN ["npm", "install"]

FROM debian:bullseye-slim
WORKDIR /opt/podlighter
COPY assets assets/
COPY templates templates/
COPY --from=node /usr/local/src/podlighter/node_modules node_modules/
COPY --from=golang /usr/local/src/podlighter/podlighter /usr/local/bin/podlighter
CMD ["podlighter"]
EXPOSE 80
