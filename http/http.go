package http

import "net/http"

const (
	MimeApplicationJSON = "application/json; charset=utf-8"
)

func SetContentType(header http.Header, mime string) {
	header.Set("Content-Type", mime)
	header.Set("X-Content-Type-Options", "nosniff")
}

func RestrictedHandler(allowedMethods []string, handler http.Handler) http.Handler {
	return &restrictedHandler{
		AllowedMethods: allowedMethods,
		Handler:        handler,
	}
}

func JSONHandler(v interface{}) http.Handler {
	return &jsonHandler{v}
}
