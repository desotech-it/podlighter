package http

import (
	"net/http"

	"github.com/desotech-it/podlighter/internal/util"
)

type restrictedHandler struct {
	allowedMethods []string
	allowValue     string
	handler        http.Handler
}

func (h *restrictedHandler) hasAllowedMethod(r *http.Request) bool {
	return util.IndexOfString(h.allowedMethods, r.Method) != -1
}

func (h *restrictedHandler) writeAllowHeader(header http.Header) {
	header.Set("Allow", h.allowValue)
}

func (h *restrictedHandler) optionsHandler(rw http.ResponseWriter) {
	header := rw.Header()
	h.writeAllowHeader(header)
	rw.WriteHeader(http.StatusNoContent)
}

func (h *restrictedHandler) notAllowedHandler(rw http.ResponseWriter) {
	header := rw.Header()
	h.writeAllowHeader(header)
	rw.WriteHeader(http.StatusMethodNotAllowed)
}

func (h *restrictedHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	if !h.hasAllowedMethod(r) {
		h.notAllowedHandler(rw)
	} else if r.Method == http.MethodOptions {
		h.optionsHandler(rw)
	} else {
		h.handler.ServeHTTP(rw, r)
	}
}
