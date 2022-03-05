package env

import "os"

func Namespace() string {
	if namespaceFromEnv := os.Getenv("NAMESPACE"); len(namespaceFromEnv) != 0 {
		return namespaceFromEnv
	} else {
		return "default"
	}
}
