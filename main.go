package main

import (
	"flag"
	"log"
	"net/http"
	"path/filepath"

	"github.com/desotech-it/podlighter/api"
	"github.com/desotech-it/podlighter/handler"
	"k8s.io/client-go/util/homedir"
)

func main() {
	var kubeconfig *string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
	}
	flag.Parse()

	client, err := api.NewClient(*kubeconfig)
	if err != nil {
		log.Fatalln(err)
	}
	mux := http.NewServeMux()
	mux.Handle("/api/", http.StripPrefix("/api", handler.ApiHandler(client)))
	srv := http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	srv.ListenAndServe()
}
