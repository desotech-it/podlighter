package handler

import (
	"net/url"

	"github.com/desotech-it/podlighter/env"
)

func indexOfString(haystack []string, needle string) int {
	for i, s := range haystack {
		if s == needle {
			return i
		}
	}
	return -1
}

func namespaceFromValues(values url.Values) string {
	if ns := values.Get("namespace"); len(ns) != 0 {
		return ns
	}
	return env.Namespace()
}
