package api

import (
	"io"
	"log"
	"net/http"
)

type endpointsHandler struct {
	client Client
}

func (h endpointsHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	if endpoints, err := h.client.Endpoints(r.Context(), "podlighter", "podlighter"); err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
	} else if body, err := marshalJSON(endpoints); err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
	} else {
		header := rw.Header()
		writeContentTypeHeader(mimeApplicationJSON, header)
		rw.WriteHeader(http.StatusOK)
		if _, err := io.Copy(rw, body); err != nil {
			log.Println(err)
		}
	}
}
