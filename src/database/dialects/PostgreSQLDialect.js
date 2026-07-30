compileString(column) {

    return `VARCHAR(${column.getLength() ?? 255})`;

}

compileInteger() {

    return 'INTEGER';

}

compileBoolean() {

    return 'BOOLEAN';

}

compileUUID() {

    return 'UUID';

}

compileJson() {

    return 'JSONB';

}

compileDateTime() {

    return 'TIMESTAMP';

}