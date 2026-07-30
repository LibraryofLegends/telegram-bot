compileString(column) {

    return `VARCHAR(${column.getLength() ?? 255})`;

}

compileInteger() {

    return 'INT';

}

compileBoolean() {

    return 'TINYINT(1)';

}

compileUUID() {

    return 'CHAR(36)';

}

compileJson() {

    return 'JSON';

}

compileDateTime() {

    return 'DATETIME';

}