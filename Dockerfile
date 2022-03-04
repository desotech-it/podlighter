FROM golang:1.17-bullseye AS build
WORKDIR /usr/local/src/podlighter
COPY . .
RUN ["make"]

FROM debian:bullseye-slim
WORKDIR /usr/local/bin
COPY --from=build /usr/local/src/podlighter/podlighter .
CMD ["podlighter"]
