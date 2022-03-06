package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"
)

type jsonHandler struct {
	v interface{}
}

func (h jsonHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	buff := bytes.Buffer{}
	if err := json.NewEncoder(&buff).Encode(h.v); err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
	} else {
		SetContentType(rw.Header(), ContentTypeApplicationJSON)
		content := bytes.NewReader(buff.Bytes())
		http.ServeContent(rw, r, "", time.Unix(0, 0), content)
	}
}
