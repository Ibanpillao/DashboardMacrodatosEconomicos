'use strict';

// URL API
var periodo = 12;
const urlDatosTabla = 'https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/';
const urlDatosSerie = 'https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/';

const urlHipotecasMensual = urlDatosTabla + '13896?nult=' + periodo; // Ultimos 12 meses
const urlCCAA = 'https://servicios.ine.es/wstempus/js/ES/VALORES_GRUPOSTABLA/22350/81497'; // Nombres CCAA
const urlVivienda = urlDatosTabla + '25171?nult=2';
const urlIPC = urlDatosSerie + 'IPC206449?nult=2';
const urlIPCTotalCCAA = urlDatosTabla + '50917?nult=2';
const urlIngresos = urlDatosSerie + 'CTNFSI6856?nult=2';
const urlPIB = urlDatosSerie + 'CNTR6358?nult=2';
const urlParo = urlDatosTabla + '4247?nult=2';
const urlMercado = urlDatosTabla + '27065?nult=1';

// INDICADORES
const indicadorHipotecas = document.getElementById('art1');
const indicadorVivienda = document.getElementById('art2');
const indicadorPIB = document.getElementById('art3');
const indicadorCuatro = document.getElementById('art4');
const indicadorIPC = document.getElementById('art8');
const indicadorParo = document.getElementById('art9');

// OTROS
const tituloFinca = document.querySelector('#tituloFinca');
const tituloImporte = document.querySelector('#tituloImporte');
const cargaAPI = $('#cargaApi');
const selectCA = $('#selectCA');

// CANVAS
const canvasUno = document.getElementById('canvasUno'); 
const canvasDos = document.getElementById('canvasDos'); 
const canvasTres = document.getElementById('canvasTres');
const infoAPI = document.querySelector('#infoAPIGeneral');

// PATRONES
var ccaa = /Total Nacional. /;
var mensual = /Variación mensual. /;
var anual = /Variación anual. /;
var tipoFinca = /Total fincas. /;
var vivienda = /Viviendas. /;
const numImporte = /Número de hipotecas. /;
const numImporteDos = /Importe de hipotecas/;
const todasEdades = /Todas las edades. /;
const filtrosMercado = [/Total industria. /, /Bienes de consumo. /, /Bienes de equipo. /, /Bienes intermedios. /, /Energía. /];
const pib = /Producto interior bruto a precios de mercado/;

// CHARTJS
let chartUno, chartDos, chartTres;


///////////////////   EVENTOS  //////////////////////
$('#buscarCA').click(function() {
    ccaa = new RegExp($('#selectCA').val());

    obtenerURL(urlHipotecasMensual)
        .then( dataMes => dataMes.json() )
        .then( dataMes => {
            imprimirDatos(dataMes, ccaa);
            return obtenerAPIS();
            }
        )
        .catch( error => console.log(error) );
});

$('#buscarTipoFinca').click(function() {
    let tipoFinca = new RegExp($('#selectTipoFinca').val());
    obtenerURL(urlHipotecasMensual)
        .then( data => data.json() )
        .then( data => {
            dibujarCirculo(data, ccaa, numImporte, tipoFinca);
            tituloFinca.innerHTML = 'Tipo hipotecas - ' + limpiarPatron(tipoFinca) + ' - ' + limpiarPatron(ccaa);
        }
    )
    .catch( error => console.log(error) );
});

// Retorna la diferencia de dos valores dados limitado a 1 decimal
function getDiferenciaIndices(dato1, dato2) {
    return (dato1 - dato2).toFixed(1);
}

// Retorna una imagen de subida o bajada de valores
function getSubidaBajadaIMG(diferencia) {
    var src;
    if (diferencia > 0) {
        src = `<small style='background:rgba(153, 255, 153);color:green;'><img src='img/sube.svg'/>${diferencia}</small>`;
    } else if (diferencia < 0) {
        src = `<small style='background:rgb(255, 51, 0,.3);color:red;'><img src='/img/baja.svg'/>${diferencia}</small>`;
    } else src = `<small style='background:rgb(0,0,0,.2);color:black'><img src='/img/equal.svg'/> ${diferencia}</small>`;
    return src;
}

// Asignar color a gráficas de libreria chartjs
function asignarColorGraficas (array) {
    var arrayColores = [];
    var color = 'gray';
    for (var i = 0; i < array.length-1; i++) {
        arrayColores.push(color);
    }
    arrayColores.push('rgb(51, 102, 255,.6)');
    return arrayColores;
}

// Limpiar caracteres RegExp
function limpiarPatron(patron) {
    return `${patron.toString().replace(/\//g,'')}`;
}

// PEDIR API
function obtenerURL(url) {
    return fetch(url);
}

// Imprimir datos en graficas
function imprimirDatos(datosMes, ccaa) {
	dibujarLinea(datosMes, ccaa, numImporte, tipoFinca);
    dibujarBarra(datosMes, ccaa, numImporteDos, tipoFinca);
    dibujarCirculo(datosMes, ccaa, numImporte, vivienda);
}

// Filtrar datos por CCAA
function getDatosCCAA(data, ccaa, filtro, indicador, dato) {
    var datosArray = [];
    for(var a in data) {
        if(filtro.test(data[a].Nombre) && ccaa.test(data[a].Nombre)){
            for(var b of data[a].Data) {
                datosArray.push(b.Valor);
            }
        }
    }
    var diferencia = getDiferenciaIndices(datosArray[0],datosArray[1]);
    indicador.innerHTML = '<h2>' + datosArray[0] + `</h2><span>${dato}<small class='patron'>${limpiarPatron(ccaa)}</small></span><span>${getSubidaBajadaIMG(diferencia)}</span>`;
}

// Obtener APIs y mostrar datos en indicadores
function obtenerAPIS() {
    obtenerURL(urlHipotecasMensual)
        .then( data => data.json()) // HIPOTECAS
        .then( data => {
            getDatosCCAA(data,ccaa,/Total fincas/,indicadorHipotecas,"Hipotecas constituidas");
            return obtenerURL(urlVivienda);
        })
        .then( data => data.json()) // IPV
        .then( data => {
            getDatosCCAA(data,ccaa,/General. Variación trimestral/,indicadorVivienda,"IPV");
            return obtenerURL(urlIPCTotalCCAA);
        })
        .then( data => data.json()) // IPC
        .then( data => {
            getDatosCCAA(data,ccaa, ccaa,indicadorIPC,"IPC");
            return obtenerURL(urlIngresos);
        })
        .then (data => data.json()) // Ingresos Administracion
        .then( data => {
            var indiceActual = data.Data[1].Valor;
            var diferencia = getDiferenciaIndices(indiceActual,data.Data[0].Valor);
            indicadorCuatro.innerHTML = '<h2>' + indiceActual + `</h2><span>Ingresos</span><small class='patron'>Total nacional</small><span>${getSubidaBajadaIMG(diferencia)}</span>`;
            return obtenerURL(urlPIB);
        })
        .then (data => data.json()) // PIB
        .then( data => {
            var indiceActual = data.Data[1].Valor;
            var diferencia = getDiferenciaIndices(indiceActual,data.Data[0].Valor);
            indicadorPIB.innerHTML = '<h2>' + indiceActual.toFixed(1) + `</h2><span>PIB</span><small class='patron'>Total nacional</small><span>${getSubidaBajadaIMG(diferencia)}</span>`;  
            return obtenerURL(urlParo);
        })
        .then (data => data.json()) // Paro
        .then( data => {
            getDatosCCAA(data,ccaa, /Todas las edades/,indicadorParo,"PARO");
            }
        )
        .catch( error => console.log(error)); 
}

// Conseguir valores de hipoteca filtrados por CCAA, tipo de finca y tipo de operacion
// Devuelve un array con los datos
function getTipoHipoteca(datosApi, ccaa, tipo, valorDevuelto) {	
    var arrayDatos = [], arrayAnios = [], datos = [];

	for(var a in datosApi){
		var nombre = datosApi[a].Nombre; 
   		if (ccaa.test(nombre) && tipo.test(nombre) && valorDevuelto.test(nombre) ) {
   			for(var b of datosApi[a].Data){
                arrayDatos.push(b.Valor);  	
                arrayAnios.push(getMes(b.FK_Periodo) + ' - ' + b.Anyo);  
   			}	     				
   		}
   	}
    datos.push(arrayDatos, arrayAnios);
    return datos;
}

// Averiguar fecha filtrada por periodo de tabla INE
function getMes(valor) {
    switch(valor) {
        case 12:
            return 'Diciembre';
        case 11:
            return 'Noviembre';
        case 10:
            return 'Octubre';
        case 9:
            return 'Septiembre';
        case 8:
            return 'Agosto';
        case 7:
            return 'Julio';
        case 6:
            return 'Junio';
        case 5:
            return 'Mayo';
        case 4:
            return 'Abril';
        case 3:
            return 'Marzo';
        case 2:
            return 'Febrero';
        case 1:
            return 'Enero';
    }
}

// Añade dos elementos al HTML con los nombres y valores del mercado de la industria
function getIndicesMercados(datosApi, valoresMercado, elementoHTML) {
    var mesActual = getMes(datosApi[0].Data[0].FK_Periodo);
    var anyoActual = datosApi[0].Data[0].Anyo;

    for (var a in datosApi) {
        var nombre = datosApi[a].Nombre;  
        if ( ccaa.test(nombre) && mensual.test(nombre) ) {
            for (var b of datosApi[a].Data) {
                var parrafo = $('<p>'), span = $('<span>');
                span.html(getSubidaBajadaIMG(b.Valor));

                for (var valor in valoresMercado) {
                    if ( valoresMercado[valor].test(nombre) ) {
                        parrafo.html(limpiarPatron(valoresMercado[valor])).append(span);
                        elementoHTML.append(parrafo);    
                    }  
                }
            }
        }
    }
    $('#art10').append(`<p id='mesActual'><span class='patron'>Total nacional</span> - ${mesActual + `  ` + anyoActual}</p>`);

}

// Grafica lineas
function dibujarLinea(datosMes, ccaa, numImporte, tipoFinca){
	var datos = getTipoHipoteca(datosMes, ccaa, tipoFinca, numImporte);	

	const data = {
					labels: datos[1].map(valor => valor).reverse(),
					datasets: [
                                {
                                    data: datos[0].reverse(),
                                    backgroundColor: asignarColorGraficas(datos[0]),
                                    borderWidth: 1,
                                    fill: false,
                                    borderColor: 'rgba(0,0,0,.9)',
                                    tension: 0.3 
                                }
                    ]
				}
                
    const options = {
                    plugins: {
                        legend: {
                            position: 'center',
                            display: true
                        },
                        title: {
                            display: true,
                            text: limpiarPatron(ccaa),
                            padding: {
                                top: 10,
                                bottom: 10
                            },
                        }   
                    },
                    scales: {
                        x: {
                            display: false 
                        }
                    }
                    
    }
    if (chartUno) {
        chartUno.destroy();
    }
	chartUno = new Chart(canvasUno, {type: 'line', data, options});
	
}

// Grafica barras
function dibujarBarra(datosApi, ccaa, numImporte, tipoFinca){
	var datos = getTipoHipoteca(datosApi, ccaa, tipoFinca,numImporte);
    tituloImporte.innerHTML = limpiarPatron(numImporte) + ' - ' + limpiarPatron(ccaa);
				
	const data = {
					labels: datos[1].map(valor => valor).reverse(),
					datasets: [ 
								{
									data: datos[0].reverse(),
									backgroundColor: asignarColorGraficas(datos[0]),
                                    borderWidth: 1
                                }
                    ]
				}
    const options = {
                    plugins: {
                        legend: {
                            position: 'center',
                        },
                        title: {
                            display: true,
                            padding: {
                                top: 10,
                                bottom: 10
                            },
                            color: 'black',
                        }
                    },
                    scales: {
                        yAxis: {
                            display: false
                        },
                        x: {
                            display: false
                        }
                    }
    }
    
	if (chartDos) {
        chartDos.destroy();
    }
	chartDos = new Chart(canvasDos, {type: 'bar', data, options});
	
}

// Grafica polarArea
function dibujarCirculo(datosApi, ccaa, numImporte, tipoFinca){
    tituloFinca.innerHTML = 'Hipotecas - ' + limpiarPatron(tipoFinca) + ' - ' + limpiarPatron(ccaa);
	var datos = getTipoHipoteca(datosApi, ccaa, tipoFinca, numImporte);	

    datos[0] = datos[0].slice(0, 3).reverse();
    datos[1] = datos[1].slice(0, 3).reverse();
			
	const data = {
					labels: datos[1].map(valor => valor ),
					datasets: [
								{
									data: datos[0],
									backgroundColor: asignarColorGraficas(datos[1]),
                                    borderWidth: 1,
                                    
                                }
                    ]
				}
    const options = {
                    plugins: {
                        responsive: true,
                        legend: {
                            position: 'right'                        
                        },
                        title: {
                            display: true,
                            padding: {
                                top: 10,
                                bottom: 10
                            },
                            color: 'black',
                        }
                    },
                    scales: {
                        
                    }
    }
    
	if (chartTres) {
        chartTres.destroy();
    }
	chartTres = new Chart(canvasTres, {type: 'doughnut', data, options});	
}


///////////////////     MAIN  ///////////////////
$(document).ready(function(){

    // Retirar caja aviso de carga de API
    cargaAPI.slideUp(800);

    // Lamada a la función para pedir las APIs
    obtenerURL(urlHipotecasMensual)
        .then( dataMes => dataMes.json() )
        .then( dataMes => {
                imprimirDatos(dataMes, ccaa);
                getDatosCCAA(dataMes,ccaa,tipoFinca,indicadorHipotecas,"Hipotecas constituidas");
                return obtenerURL(urlCCAA);
            }
        )
        .then( data => data.json() ) // Nombres de CCAA
        .then( data => {
            data.forEach(function(valor){
                selectCA.append(`<option>${valor.Nombre}</option>`);
            })
            return obtenerURL(urlMercado);
        })
        .then( data => data.json()) // Indices Mercado Nacional
        .then( data => {
            var cajaMercado = $('#cajaMercado');
            getIndicesMercados(data, filtrosMercado, cajaMercado);
            return obtenerAPIS();
        })
        .catch( error => console.log(error)); 
		
});