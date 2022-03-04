package api

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

var (
	api *Api = nil
)

type Api struct {
	*http.ServeMux
	clientset *kubernetes.Clientset
}

func (a *Api) handleRoutes() {
	a.HandleFunc("/endpoints", func(rw http.ResponseWriter, r *http.Request) {
		if endpoints, err := a.Endpoints(r.Context(), "podlighter", "podlighter"); err != nil {
			http.Error(rw, err.Error(), http.StatusInternalServerError)
		} else if body, err := marshalJSON(endpoints); err != nil {
			http.Error(rw, err.Error(), http.StatusInternalServerError)
		} else {
			header := rw.Header()
			header.Set("Content-Type", "application/json; charset=utf-8")
			header.Set("X-Content-Type-Options", "nosniff")
			rw.WriteHeader(http.StatusOK)
			if _, err := io.Copy(rw, body); err != nil {
				log.Println(err)
			}
		}
	})
}

func marshalJSON(v interface{}) (io.Reader, error) {
	buff := new(bytes.Buffer)
	if err := json.NewEncoder(buff).Encode(v); err != nil {
		return nil, err
	} else {
		return buff, nil
	}
}

func New() (*Api, error) {
	if api == nil {
		config, err := rest.InClusterConfig()
		if err != nil {
			return nil, err
		}
		clientset, err := kubernetes.NewForConfig(config)
		if err != nil {
			return nil, err
		}
		api = &Api{http.NewServeMux(), clientset}
		api.handleRoutes()
	}
	return api, nil
}
