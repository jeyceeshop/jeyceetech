export function orderPhone(data){
 const code=typeof data.countryCode==='string'?data.countryCode.trim():'';
 const phone=typeof data.phone==='string'?data.phone.trim():'';
 if(!/^\+[1-9][0-9]{0,2}$/.test(code))throw Error('Indica el código de país con + y de 1 a 3 dígitos, por ejemplo +507.');
 const digits=phone.replace(/[ ()-]/g,'');
 if(phone.length>24||!/^[0-9 ()-]+$/.test(phone)||!/^[0-9]{6,14}$/.test(digits)||code.length-1+digits.length>15)throw Error('Indica un teléfono válido, sin repetir el código de país (de 6 a 14 dígitos; máximo 15 con el código).');
 return code+' '+digits;
}
