CREATE TABLE recuperacionContrasena (
  idRecuperacion INT UNSIGNED NOT NULL AUTO_INCREMENT,
  idCliente INT DEFAULT NULL,
  idFotografo INT DEFAULT NULL,
  hashToken BINARY(32) NOT NULL,
  expiraEn DATETIME(6) NOT NULL,
  PRIMARY KEY (idRecuperacion),
  UNIQUE KEY (hashToken),
  UNIQUE KEY (idCliente),
  UNIQUE KEY (idFotografo),
  CHECK ((idCliente IS NULL) <> (idFotografo IS NULL)),
  FOREIGN KEY (idCliente) REFERENCES usuariocliente (idCliente) ON DELETE CASCADE,
  FOREIGN KEY (idFotografo) REFERENCES usuariofotografo (idFotografo) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE limiteRecuperacionContrasena (
  clave VARCHAR(100) COLLATE latin1_spanish_ci NOT NULL,
  venceEn DATETIME(6) NOT NULL,
  intentos SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (clave),
  KEY (venceEn)
) ENGINE=InnoDB;
