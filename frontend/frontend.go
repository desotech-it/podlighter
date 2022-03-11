package frontend

import (
	"bytes"
	"net/http"
	"time"

	"github.com/desotech-it/podlighter/frontend/internal/view"
	pkghttp "github.com/desotech-it/podlighter/http"
)

type frontendHandler struct {
	mux *http.ServeMux
}

func (h frontendHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	h.mux.ServeHTTP(rw, r)
}

func setRoutes(mux *http.ServeMux) {
	mux.Handle("/home/", newHomeHandler())
}

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	setRoutes(mux)
	return frontendHandler{mux}
}

type homeHandler struct {
}

func (h *homeHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	buff := bytes.Buffer{}
	if err := view.NewHomeView("Podlighter - Home").Render(&buff); err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
	} else {
		pkghttp.SetContentType(rw.Header(), "text/html; charset=utf-8")
		http.ServeContent(rw, r, "", time.Unix(0, 0), bytes.NewReader(buff.Bytes()))
	}
}

func newHomeHandler() http.Handler {
	return &homeHandler{}
}
