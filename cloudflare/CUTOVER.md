# Cambio de DNS: ajuste de configuración (NO aplicar hasta que se autorice)

Se aplica en el Pull Request de cambio de dominio, **después** de conectar `enmytrendsrd.com` como Custom Domain desde el panel y de comprobar que funciona:

```diff
-  "workers_dev": true,
-  "preview_urls": false
+  "workers_dev": false,
+  "preview_urls": false,
+  "routes": [
+    { "pattern": "enmytrendsrd.com", "custom_domain": true }
+  ]
```

Con esto el Worker de producción solo responde en `https://enmytrendsrd.com`. La dirección `*.workers.dev` y las URL de versiones quedan apagadas. La redirección de `www` va aparte, con una Redirect Rule de la zona.
