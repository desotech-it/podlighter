FROM golang:1.17-bullseye AS golang
WORKDIR /usr/local/src/podlighter
COPY . .
RUN ["make"]

FROM node:16-bullseye AS node
WORKDIR /usr/local/src/podlighter
COPY . .
RUN ["make", "node_modules"]

FROM debian:bullseye-slim
WORKDIR /opt/podlighter
COPY assets assets/
COPY templates templates/
COPY --from=node /usr/local/src/podlighter/node_modules node_modules/
COPY --from=golang /usr/local/src/podlighter/podlighter /usr/local/bin/podlighter
CMD ["podlighter"]
EXPOSE 80
