package app

import (
	"flag"
	"net/http"

	"github.com/desotech-it/podlighter/api"
	"github.com/desotech-it/podlighter/frontend"
)

var (
	address        string
	kubeconfigPath string
	help           bool
)

func init() {
	flag.StringVar(&address, "address", "0.0.0.0:80", "address to listen on")
	flag.StringVar(&kubeconfigPath, "kubeconfig", "", "path to kubeconfig file")
	flag.BoolVar(&help, "help", false, "show help screen")
	flag.Parse()
}

type App struct {
	Config *Config
}

func IsHelp() bool {
	return help
}

func PrintHelp() {
	flag.PrintDefaults()
}

func (a *App) ListenAndServe() error {
	client, err := api.NewClient(a.Config.KubeconfigPath)
	if err != nil {
		return err
	}

	mux := http.NewServeMux()
	mux.Handle("/api/", http.StripPrefix("/api", api.NewHandler(client)))
	mux.Handle("/static/", http.StripPrefix("/static", http.FileServer(http.Dir("node_modules"))))
	mux.Handle("/assets/", http.StripPrefix("/assets", http.FileServer(http.Dir("assets"))))
	mux.Handle("/", frontend.NewHandler())

	srv := http.Server{
		Addr:    a.Config.Address,
		Handler: mux,
	}

	srv.ListenAndServe()

	return nil
}
