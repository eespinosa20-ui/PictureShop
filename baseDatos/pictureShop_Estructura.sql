USE pictureshop;

CREATE TABLE recuperacionContrasena (
    idRecuperacion INT UNSIGNED NOT NULL AUTO_INCREMENT,
    idCliente INT DEFAULT NULL,
    idFotografo INT DEFAULT NULL,
    hashToken BINARY(32) NOT NULL,
    expiraEn DATETIME(6) NOT NULL,

    PRIMARY KEY (idRecuperacion),

    UNIQUE KEY uqHashToken (hashToken),
    UNIQUE KEY uqRecuperacionCliente (idCliente),
    UNIQUE KEY uqRecuperacionFotografo (idFotografo),

    CONSTRAINT chkTipoUsuarioRecuperacion
        CHECK ((idCliente IS NULL) <> (idFotografo IS NULL)),

    CONSTRAINT fkRecuperacionCliente
        FOREIGN KEY (idCliente)
        REFERENCES usuariocliente(idCliente)
        ON DELETE CASCADE,

    CONSTRAINT fkRecuperacionFotografo
        FOREIGN KEY (idFotografo)
        REFERENCES usuariofotografo(idFotografo)
        ON DELETE CASCADE

) ENGINE=InnoDB;

CREATE TABLE limiteRecuperacionContrasena (
    clave VARCHAR(100) COLLATE latin1_spanish_ci NOT NULL,
    venceEn DATETIME(6) NOT NULL,
    intentos SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (clave),
    KEY idxVenceEn (venceEn)

) ENGINE=InnoDB;