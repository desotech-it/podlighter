package main

import (
	"log"
	"net/http"

	"github.com/desotech-it/podligther/api"
)

func main() {
	client, err := api.NewInCluster()
	if err != nil {
		log.Fatalln(err)
	}
	handler := http.NewServeMux()
	handler.Handle("/api/", http.StripPrefix("/api", api.WithClient(client)))
	srv := http.Server{
		Addr:    ":8080",
		Handler: handler,
	}

	srv.ListenAndServe()
}
