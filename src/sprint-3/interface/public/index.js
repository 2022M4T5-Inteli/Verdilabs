/* Este script coordena a atualização assíncrona da página principal da interface gráfica
de Greener de acordo com os dados recebidos do ESP e sua adequação às regras do negócio.

Este script prioriza a pior medida, ou seja, caso apenas um dos indicadores esteja fora
do intervalo permitido, a interface ficará vermelha e sinalizará urgência mesmo assim, 
independentemente de o outro indicador estar normal.

Este script também atende apenas a estufa 1 no momento. Suas funções serão generalizadas
para os outros cards e medidas nas próximas sprints. */


$(document).ready(function () {

    // Constantes para guardar limites dos intervalos permitidos para cada indicador
    const tempMin = 28;
    const tempMax = 36;
    const humidityMin = 70;
    const humidityMax = 95;

    // Variáveis que guardam estado do sistema, isto é, 
    // se é necessário mostrar mensagens de alerta e/ou urgência
    let cautionNeeded = false;
    let urgencyNeeded = false;

    // Função que atualiza data e hora no header e nos cards (no momento, apenas estufa 1)
    $(function () {
        // Bloco de código é executado a cada minuto
        setInterval(function () {
            moment.locale('pt-br'); // Localização para data e hora é setada para Brasil

            $('#time').html(moment().format('LT')); // Hora no header é exibida da forma brasileira
            $('#estufa1-time').html(moment().format('LT')); // Hora do card é exibida da forma brasileira
            $('#date').html(moment().format('LL')); // Data no header é exibida da forma brasileira
        }, 1000);
    })

    // Faz uma requisição GET para as últimas leituras recebidas do ESP pelo servidor
    const getReadings = function () {
        fetch("http://192.168.1.108:1234/last_readings")
            .then(response => response.json() // Transforma payload em json
                .then(data => updateCards(data))) // Passa json para a função de atualizar cards de estufas
    }

    // Checa medida de temperatura e exibe legenda correspondente, se necessário, 
    // e seta a flag de urgência e/ou alerta segundo regras do negócio
    function checkTemperature(temp) {
        if (temp < tempMin * 0.95) {
            urgencyNeeded = true; // seta urgência como true
            $('#subtitle-temp').text("Estufa(s) frias!"); // exibe legenda de que estufas estão frias
        } else if (temp < tempMin) {
            cautionNeeded = true;
            $('#subtitle-temp').text("Estufa(s) esfriando");
        } else if (temp > tempMax * 1.1) {
            urgencyNeeded = true;
            $('#subtitle-temp').text("Estufa(s) superaquecidas!");
        } else if (temp > tempMax * 1.05) {
            urgencyNeeded = true;
            $('#subtitle-temp').text("Estufa(s) superaquecidas!");
        } else if (temp > tempMax * 1.03) {
            urgencyNeeded = true;
            $('#subtitle').text("Estufa(s) superaquecidas!");
        } else if (temp > tempMax) {
            cautionNeeded = true;
            $('#subtitle').text("Estufa(s) aquecendo");
        } else if (temp > tempMin && temp < tempMax) {
            $('#subtitle-temp').text("");
        }
    }

    // Checa medidade de umidade e altera legenda e flags de urgência/alerta conforme necessário
    function checkHumidity(humidity) {
        if (humidity < humidityMin * 0.95) {
            urgencyNeeded = true;
            $('#subtitle-hum').text("Estufa(s) muito secas!");
        } else if (humidity < humidityMin) {
            cautionNeeded = true;
            $('#subtitle-hum').text("Estufa(s) ficando secas");
        } else if (humidity > humidityMax) {
            urgencyNeeded = true;
            $('#subtitle-hum').text("Estufa(s) muito úmidas!");
        } else {
            $('#subtitle-hum').text("");
        }
    }

    // Atualiza os cards e o status conforme medidas recebidas
    function updateCards(readings) {
        // Reseta flags
        urgencyNeeded = false
        cautionNeeded = false

        // Isola temperatura e umidade da estufa 1. Essas funções serão generalizadas
        // nas próximas sprints
        let temp = Number.parseFloat(readings[0].temperature)
        let humidity = Number.parseFloat(readings[0].humidity)

        // Exibe medidas no card correspodente
        for (let i = 0; i < 1; i++) {
            $('#temp-estufa' + (i + 1)).text(readings[i].temperature + " ºC")
            $('#hum-estufa' + (i + 1)).text(readings[i].humidity + "%")
        }

        // Checa se umidade e temperatura se adaptam às regras do negócio
        checkHumidity(humidity);
        checkTemperature(temp);

        // Se alguma medida estiver na zona de tolerância, troca ícone pela exclamação amarela, 
        // exibe "Atenção" no status e adicionar sombra amarela atrás do card da estufa
        if (cautionNeeded) {
            $("#status-image").attr("src", "assets/yellow.png");
            $('#status-text').text("Atenção!")
            $('#estufa1-card').css("box-shadow", "0 4px 4px 0 rgba(251, 203, 6, 0.5), 0 10px 20px 0 rgba(251, 203, 6, 0.4)")

        // Se alguma medida estiver fora do intervalo permitido, troca ícone pelo x vermelho, 
        // exibe "Perigo" no status e adicionar sombra vermelha atrás do card da estufa
        } if (urgencyNeeded) {
            $("#status-image").attr("src", "assets/red.png");
            $('#status-text').text("Perigo!")
            $('#estufa1-card').css("box-shadow", "0 4px 4px 0 rgba(203, 19, 19, 0.5), 0 10px 20px 0 rgba(203, 19, 19, 0.4)")

        // Se estiver tudo dentro de desejado, troca o ícone pelo OK verde, exibe "Tudo Certo" e remove
        // sombras coloridas do card da estufa
        } else {
            $("#status-image").attr("src", "assets/green.png");
            $('#status-text').text("Tudo certo!")
            $('#estufa1-card').css("box-shadow", "")
        }
    }

    // Recebe leituras assim que a página carrega
    getReadings()
    // Atualiza leituras a cada 10 segundos
    setInterval(getReadings, 10000)
});
