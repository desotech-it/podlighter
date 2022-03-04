package main

import (
	"net/http"

	"github.com/desotech-it/podligther/api"
)

func main() {
	apiHandler, _ := api.New()
	handler := http.NewServeMux()
	handler.Handle("/api/", http.StripPrefix("/api", apiHandler))
	srv := http.Server{
		Addr:    ":8080",
		Handler: handler,
	}

	srv.ListenAndServe()
}
