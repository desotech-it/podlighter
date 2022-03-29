package app

type Config struct {
	Address        string
	KubeconfigPath string
}

func ConfigFromFlags() *Config {
	return &Config{
		Address:        address,
		KubeconfigPath: kubeconfigPath,
	}
}
