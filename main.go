package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/desotech-it/podlighter/api"
	"github.com/desotech-it/podlighter/frontend"
	"k8s.io/client-go/util/homedir"
)

func main() {
	var kubeconfig string
	kubeconfigPath := filepath.Join(homedir.HomeDir(), ".kube", "config")
	if _, err := os.Stat(kubeconfigPath); err != nil {
		log.Println(err)
	} else {
		kubeconfig = kubeconfigPath
	}

	client, err := api.NewClient(kubeconfig)
	if err != nil {
		log.Fatalln(err)
	}
	mux := http.NewServeMux()
	mux.Handle("/api/", http.StripPrefix("/api", api.NewHandler(client)))
	mux.Handle("/static/", http.StripPrefix("/static", http.FileServer(http.Dir("node_modules"))))
	mux.Handle("/assets/", http.StripPrefix("/assets", http.FileServer(http.Dir("assets"))))
	mux.Handle("/", frontend.NewHandler())
	srv := http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	srv.ListenAndServe()
}
