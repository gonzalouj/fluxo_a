### Métodos y Modelos

### de Ingeniería de

### Software

### INFO 290

Dra. Valeria Henríquez N.

###### Prueba de entrada

## Prueba de entrada (10 min)

```
https://forms.gle/yRfU4JtwVbv1qgFk
```

https://martinfowler.com/architecture/

https://martinfowler.com/articles/is-quality-worth-cost.html

https://martinfowler.com/architecture/

https://martinfowler.com/articles/is-quality-worth-cost.html

**La calidad del software se mide en la facilidad de añadir una nueva funcionalidad**

###### La calidad del software se refleja en la facilidad de añadir una nueva

###### funcionalidad

###### El código que escribes hoy es el código legado de mañana

###### Casos de Prueba

Automatización

**Pruebas Unitarias:** Pruebas pequeñas, rápidas y
aisladas que verifican la funcionalidad de
componentes individuales o unidades de código.
Las pruebas unitarias no tienen que esperar hasta
que se desarrolle una interfaz de usuario.

**Pruebas API:** Verificar el comportamiento de una
aplicación con bases de datos, servicios
separados o sistemas de archivos. Pueden ayudar
a detectar defectos que se producen cuando se
combinan varios componentes, como interfaces
incompatibles o intercambios de datos incorrectos.

**Pruebas GUI:** Estas pruebas suelen simular las
interacciones del usuario con la interfaz de la
aplicación, como hacer clic en botones o completar
formularios. El objetivo de las pruebas de GUI es
garantizar que la aplicación se comporte como se
espera desde la perspectiva del usuario.

**Pruebas Exploratorias:** Una estrategia para las
pruebas de software que a menudo se define
como aprendizaje, diseño y ejecución de pruebas
simultáneos. Se concentra en el descubrimiento y
depende de las instrucciones del evaluador para
descubrir defectos que son difíciles de encontrar
dentro de los parámetros de otras pruebas.

###### Buenas prácticas de Testing

###### Buenas prácticas de automatización

```
Mantenga una perspectiva del usuario final: Diseñe casos de prueba desde la perspectiva de un usuario final,
centrándose en las características de la aplicación más que en su implementación. Si está disponible, utilice
documentos como historias de usuarios, pruebas de aceptación y escenarios de BDD para capturar la
perspectiva del usuario.
```

```
Mantenlo simple: Idealmente, cada caso de prueba debería verificar una única función y debería fallar por un
solo motivo. Es más probable que los casos de prueba complejos sean inestables. Si encuentra que un caso de
prueba requiere muchos pasos, considere dividirlo en dos o más casos de prueba. En lugar de repetir los
mismos pasos en varias pruebas, cree módulos reutilizables.
```

```
Data-driven tests: Evite codificar valores de datos en sus pruebas automatizadas. En su lugar, almacene los
valores de datos para sus pruebas en un archivo externo y páselo a sus pruebas usando variables o parámetros.
En lugar de ingresar manualmente múltiples combinaciones de nombre de usuario y contraseña, o dirección de
correo electrónico y tipo de pago para validar sus campos de entrada, deje que una prueba automatizada lo haga
por usted.
```

```
Utilice una estructura modular : Un caso de prueba determinado debería poder ejecutarse independientemente de
otros casos de prueba. En la medida de lo posible, un caso de prueba no debería depender del resultado de una
prueba anterior. Por ejemplo, un caso de prueba que verifica el procesamiento de pagos para una tienda web no
debería depender de un caso de prueba anterior que coloca artículos en el carrito de compras de un usuario.
Mantener sus casos de prueba independientes no sólo hará que sus pruebas sean más fáciles de mantener, sino que
también le permitirá aprovechar la ejecución paralela o distribuida. Sin embargo, si descubre que la dependencia de
un caso de prueba es inevitable, garantice que las pruebas dependientes se ejecuten en el orden adecuado.
```

###### Buenas prácticas de automatización

**Utilice estándares de nomenclatura:** Los nombres de los elementos de

prueba deben explicarse por sí solos. Si considera que los comentarios son

necesarios para documentar un caso de prueba o paso de prueba

determinado, considere si el caso de prueba es demasiado complejo y

necesita simplificarse.

**Pruebas agrupadas por área funcional:** Agrupe sus casos de prueba según el

área funcional de la aplicación cubierta. Esto facilitará la actualización de

casos de prueba relacionados cuando se modifique un área funcional y

también le permitirá ejecutar un conjunto de regresión parcial para esa área

funcional.

**Tomar capturas de pantalla:** Configure sus pruebas automatizadas para

capturar capturas de pantalla y utilice su mecanismo de informes para

proporcionar información detallada que le ayudará a solucionar problemas de

una prueba fallida.

###### Buenas prácticas de automatización

**Pruebas de Carga:** Al menos una prueba de carga. Las pruebas de carga

son simplemente una variación de las pruebas basadas en datos, donde el

objetivo es probar la respuesta del sistema a una demanda simulada.

**Cross-browser tests:** Las pruebas entre navegadores ayudan a garantizar

que una aplicación web funcione de manera consistente

independientemente de la versión del navegador web utilizado para

acceder a ella. Por lo general, no es necesario ejecutar todo el conjunto de

pruebas en cada combinación de dispositivo y navegador, sino centrarse

en las funciones de alto riesgo y las versiones de navegador más populares

actualmente en uso.

###### Qué tests no automatizar

```
Pruebas de un solo uso: Puede llevar más tiempo automatizar una prueba de
un solo uso que ejecutarla manualmente una vez. Tenga en cuenta que la
definición de “pruebas de un solo uso” no incluye pruebas que pasarán a
formar parte de un conjunto de regresión o que estén basadas en datos.
```

```
Pruebas con resultados impredecibles: Automatice una prueba cuando el
resultado sea objetivo y pueda medirse fácilmente. Por ejemplo, un proceso de
inicio de sesión es una buena opción para la automatización porque está claro
qué debe suceder cuando se ingresan un nombre de usuario y una contraseña
válidos, o cuando se ingresan un nombre de usuario o una contraseña no
válidos. Si su caso de prueba no tiene criterios claros de aprobación/rechazo,
sería mejor que un evaluador lo realice manualmente.
```

```
Funciones que resisten la automatización: Algunas funciones están diseñadas
para resistir la automatización, como los CAPTCHA en formularios web.
```

#### Basado en el proyecto de su grupo

##### 1. Revise los casos de prueba que generó en los entregables de

##### INFO

##### 2. Automatice al menos 2 casos de prueba

###### Actividades de testing

https://www.youtube.com/watch?v=BQ-9e13kJ58&list=PLZMWkkQEwOPl0udc9Dap2NbEAkwkdOTV

##### Curso de Selenium WebDriver Test con Javascript

###### Coevaluación actividad despliegue

##### Coevaluación despliegue de repositorios:

###### https://forms.gle/RYyNfTik1oGn4GcC

###### Tarea

▪Ver lista 3 de vídeos este viernes

```
https://drive.google.com/drive/u/2/folders/1sbCXojcxVVg_TFm35w9MNbW
_4KLlz1_V
```

# Nos vemos la próxima clase
