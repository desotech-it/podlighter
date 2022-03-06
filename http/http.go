package http

import "net/http"

const (
	ContentTypeApplicationJSON = "application/json; charset=utf-8"
)

func SetContentType(header http.Header, value string) {
	header.Set("Content-Type", value)
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
