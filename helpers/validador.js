function validarRut(rut) {
    rut = rut.replace(/[.-]/g, '');
    const cuerpo = rut.slice(0, -1);
    const digitoVerificador = rut.slice(-1).toUpperCase();
    if (cuerpo.length < 7) {
        return false;
    }
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
    }

    const modulo = 11 - (suma % 11);
    const digitoEsperado = modulo === 11 ? '0' : modulo === 10 ? 'K' : modulo.toString();
    return digitoEsperado === digitoVerificador;
}

function formatearRut(rut) {
    rut = rut.replace(/[.-]/g, '');

    const cuerpo = rut.slice(0, -1);
    const digitoVerificador = rut.slice(-1);

    return `${cuerpo}-${digitoVerificador}`;
}


module.exports = { validarRut, formatearRut };
