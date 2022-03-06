package api

import (
	"net/url"
	"os"
)

func namespace() string {
	if namespaceFromEnv := os.Getenv("NAMESPACE"); len(namespaceFromEnv) != 0 {
		return namespaceFromEnv
	} else {
		return "default"
	}
}

func namespaceFromValues(values url.Values) string {
	if ns := values.Get("namespace"); len(ns) != 0 {
		return ns
	}
	return namespace()
}
