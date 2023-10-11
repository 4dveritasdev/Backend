

function currentDateTime() {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    let dateDisplay = "";
    dateDisplay = year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds;
    return dateDisplay;
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('.');
}

function formatMonth(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;

    return [year, month].join('.');
}

function formatYear(date) {
    var d = new Date(date),
        year = '' + d.getFullYear();

    return year;
}

module.exports = { currentDateTime, formatDate, formatMonth, formatYear };