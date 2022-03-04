package handler

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
)

type jsonHandler struct {
	v interface{}
}

func (h jsonHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	buff := bytes.Buffer{}
	if err := json.NewEncoder(&buff).Encode(h.v); err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
	} else {
		writeContentTypeHeader(mimeApplicationJSON, rw.Header())
		rw.WriteHeader(http.StatusOK)
		if _, err := buff.WriteTo(rw); err != nil {
			log.Println(err)
		}
	}
}

func JSONHandler(v interface{}) http.Handler {
	return &jsonHandler{v}
}
