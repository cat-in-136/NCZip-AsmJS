if (! Math.log2) {
  Math.log2 = function(x) { return Math.log(x) / Math.LN2; };
}
function NCZip() {
  this.initialize();
}
NCZip.NCZModuleAsmTemplate = function NCZModuleAsm(stdlib, foreign, buffer) {
  "asm template";//"use asm";
  
  var U1 = new stdlib.Uint8Array(buffer);
  var I1 = new stdlib.Int8Array(buffer);
  var U2 = new stdlib.Uint16Array(buffer);
  var I2 = new stdlib.Int16Array(buffer);
  var U4 = new stdlib.Uint32Array(buffer);
  var I4 = new stdlib.Int32Array(buffer);
  var F4 = new stdlib.Float32Array(buffer);
  var F8 = new stdlib.Float64Array(buffer);

  var crc_table_computed = 0;

  // CRC-32 function
  
  // create (prepare) a table of CRCs of all 8-bit messages.
  function crc32_make_crc_table(crc_table) {
    crc_table = crc_table | 0;
  
    var c = 0, n = 0, k = 0;
    for (n = 0; (n >>> 0) < 256; n = (n + 1) >>> 0) {
      c = n;
      for (k = 0; (k >>> 0) < 8; k = (k + 1) >>> 0) {
        if (c & 1) {
          c = (0xedb88320 ^ (c >>> 1)) >>> 0;
        } else {
          c = c >>> 1;
        }
      }
      // crc_table[n] = c;
      U4[(crc_table + (n * 4 | 0)) >> 2] = c;
    }
    
    crc_table_computed = 1;
  }
  
  // update a running crc with the bytes buf[0..len-1] and return the updated crc.
  function crc32_update_crc(crc, buf, len, crc_table) {
    crc = crc | 0;
    buf = buf | 0;
    len = len | 0;
    crc_table = crc_table | 0;
    var c = 0, n = 0, $SP = 0;
    c = (crc ^ 0xFFFFFFFF) >>> 0;
    for (n = 0; (n >>> 0) < (len >>> 0); n = (n + 1) >>> 0) {
      // c = (u32)(crc_table[(c ^ buf[n]) & 0xff] ^ (c >>> 8));
      c = (U4[(crc_table + (((c ^ U1[(buf + n) >> 0]) & 0xFF) * 4 | 0)) >> 2] ^ (c >>> 8)) >>> 0;
    }
    return ((c ^ 0xFFFFFFFF) >>> 0) | 0;
  }
  
  // return the CRC of the bytes buf[0..len-1].
  function crc32_crc(buf, len, crc_table) {
    buf = buf | 0;
    len = len | 0;
    crc_table = crc_table | 0;
    return crc32_update_crc(0, buf >>> 0, len >>> 0, crc_table >>> 0) | 0;
  }

  // Set a local file header.
  function zip_set_lfh(p, modtime, moddate, crc, size, fileNameLength) {
    p = p | 0;
    modtime = modtime | 0;
    moddate = moddate | 0;
    crc = crc | 0;
    size = size | 0;
    fileNameLength = fileNameLength | 0;

    // Signature
    U1[(p + 0x00) >> 0] = 0x50;
    U1[(p + 0x01) >> 0] = 0x4b;
    U1[(p + 0x02) >> 0] = 0x03;
    U1[(p + 0x03) >> 0] = 0x04;
    // Version
    U1[(p + 0x04) >> 0] = 0x0A;;
    U1[(p + 0x05) >> 0] = 0x00;
    // Flags
    U1[(p + 0x06) >> 0] = 0x00;
    U1[(p + 0x07) >> 0] = 0x00;
    // Compression = no compression
    U1[(p + 0x08) >> 0] = 0x00;
    U1[(p + 0x09) >> 0] = 0x00;
    // Mod time
    U1[(p + 0x0A) >> 0] = (modtime >> 0) & 0xFF;
    U1[(p + 0x0B) >> 0] = (modtime >> 8) & 0xFF;
    // Mod date
    U1[(p + 0x0C) >> 0] = (moddate >> 0) & 0xFF;
    U1[(p + 0x0D) >> 0] = (moddate >> 8) & 0xFF;
    // CRC-32
    U1[(p + 0x0E) >> 0] = (crc >>  0) & 0xFF;
    U1[(p + 0x0F) >> 0] = (crc >>  8) & 0xFF;
    U1[(p + 0x10) >> 0] = (crc >> 16) & 0xFF;
    U1[(p + 0x11) >> 0] = (crc >> 24) & 0xFF;
    // Compressed size
    U1[(p + 0x12) >> 0] = (size >>  0) & 0xFF;
    U1[(p + 0x13) >> 0] = (size >>  8) & 0xFF;
    U1[(p + 0x14) >> 0] = (size >> 16) & 0xFF;
    U1[(p + 0x15) >> 0] = (size >> 24) & 0xFF;
    // Uncompressed size
    U1[(p + 0x16) >> 0] = (size >>  0) & 0xFF;
    U1[(p + 0x17) >> 0] = (size >>  8) & 0xFF;
    U1[(p + 0x18) >> 0] = (size >> 16) & 0xFF;
    U1[(p + 0x19) >> 0] = (size >> 24) & 0xFF;
    // Filename length
    U1[(p + 0x1A) >> 0] = (fileNameLength >> 0) & 0xFF;
    U1[(p + 0x1B) >> 0] = (fileNameLength >> 8) & 0xFF;
    // Extra field length
    U1[(p + 0x1C) >> 0] = 0;
    U1[(p + 0x1D) >> 0] = 0;
  }
  // Set a Central directory file header.
  function zip_set_cdfh(p, modtime, moddate, crc, size, fileNameLength, ext_attr, offset) {
    p = p | 0;
    modtime = modtime | 0;
    moddate = moddate | 0;
    crc = crc | 0;
    size = size | 0;
    fileNameLength = fileNameLength | 0;
    ext_attr = ext_attr| 0;
    offset = offset | 0;

    // Signature
    U1[(p + 0x00) >> 0] = 0x50;
    U1[(p + 0x01) >> 0] = 0x4b;
    U1[(p + 0x02) >> 0] = 0x01;
    U1[(p + 0x03) >> 0] = 0x02;
    // Version
    U1[(p + 0x04) >> 0] = 0x14;
    U1[(p + 0x05) >> 0] = 0x00;
    // Vers. needed
    U1[(p + 0x06) >> 0] = 0x0A;
    U1[(p + 0x07) >> 0] = 0x00;
    // Flags
    U1[(p + 0x08) >> 0] = 0x00;
    U1[(p + 0x09) >> 0] = 0x00;
    // Compression = no compression
    U1[(p + 0x0A) >> 0] = 0x00;
    U1[(p + 0x0B) >> 0] = 0x00;
    // Mod time
    U1[(p + 0x0C) >> 0] = (modtime >> 0) & 0xFF;
    U1[(p + 0x0D) >> 0] = (modtime >> 8) & 0xFF;
    // Mod date
    U1[(p + 0x0E) >> 0] = (moddate >> 0) & 0xFF;
    U1[(p + 0x0F) >> 0] = (moddate >> 8) & 0xFF;
    // CRC-32
    U1[(p + 0x10) >> 0] = (crc >>  0) & 0xFF;
    U1[(p + 0x11) >> 0] = (crc >>  8) & 0xFF;
    U1[(p + 0x12) >> 0] = (crc >> 16) & 0xFF;
    U1[(p + 0x13) >> 0] = (crc >> 24) & 0xFF;
    // Compressed size
    U1[(p + 0x14) >> 0] = (size >>  0) & 0xFF;
    U1[(p + 0x15) >> 0] = (size >>  8) & 0xFF;
    U1[(p + 0x16) >> 0] = (size >> 16) & 0xFF;
    U1[(p + 0x17) >> 0] = (size >> 24) & 0xFF;
    // Uncompressed size
    U1[(p + 0x18) >> 0] = (size >>  0) & 0xFF;
    U1[(p + 0x19) >> 0] = (size >>  8) & 0xFF;
    U1[(p + 0x1A) >> 0] = (size >> 16) & 0xFF;
    U1[(p + 0x1B) >> 0] = (size >> 24) & 0xFF;
    // Filename length
    U1[(p + 0x1C) >> 0] = (fileNameLength >> 0) & 0xFF;
    U1[(p + 0x1D) >> 0] = (fileNameLength >> 8) & 0xFF;
    // Extra field length
    U1[(p + 0x1E) >> 0] = 0;
    U1[(p + 0x1F) >> 0] = 0;
    // File Comment length
    U1[(p + 0x20) >> 0] = 0;
    U1[(p + 0x21) >> 0] = 0;
    // Disk # Start
    U1[(p + 0x22) >> 0] = 0;
    U1[(p + 0x23) >> 0] = 0;
    // Internal attr
    U1[(p + 0x24) >> 0] = 0;
    U1[(p + 0x25) >> 0] = 0;
    // External attr
    U1[(p + 0x26) >> 0] = (ext_attr >>  0) & 0xFF;
    U1[(p + 0x27) >> 0] = (ext_attr >>  8) & 0xFF;
    U1[(p + 0x28) >> 0] = (ext_attr >> 16) & 0xFF;
    U1[(p + 0x29) >> 0] = (ext_attr >> 24) & 0xFF;
    // Offset local header
    U1[(p + 0x2A) >> 0] = (offset >>  0) & 0xFF;
    U1[(p + 0x2B) >> 0] = (offset >>  8) & 0xFF;
    U1[(p + 0x2C) >> 0] = (offset >> 16) & 0xFF;
    U1[(p + 0x2D) >> 0] = (offset >> 24) & 0xFF;
  }
  // Set an End of central directory record.
  function zip_set_eocdr(p, num_cd, cd_size, cd_offset) {
    p = p | 0;
    num_cd = num_cd | 0;
    cd_size = cd_size  | 0;
    cd_offset = cd_offset | 0;

    // Signature
    U1[(p + 0x00) >> 0] = 0x50;
    U1[(p + 0x01) >> 0] = 0x4b;
    U1[(p + 0x02) >> 0] = 0x05;
    U1[(p + 0x03) >> 0] = 0x06;
    // Disk Number
    U1[(p + 0x04) >> 0] = 0x00;
    U1[(p + 0x05) >> 0] = 0x00;
    // Disk # w/cd
    U1[(p + 0x06) >> 0] = 0x00;
    U1[(p + 0x07) >> 0] = 0x00;
    // Disk entries
    U1[(p + 0x08) >> 0] = (num_cd >>  0) & 0xFF;
    U1[(p + 0x09) >> 0] = (num_cd >>  8) & 0xFF;
    // Total entries 
    U1[(p + 0x0A) >> 0] = (num_cd >>  0) & 0xFF;
    U1[(p + 0x0B) >> 0] = (num_cd >>  8) & 0xFF;
    // Central directory size
    U1[(p + 0x0C) >> 0] = (cd_size >>  0) & 0xFF;
    U1[(p + 0x0D) >> 0] = (cd_size >>  8) & 0xFF;
    U1[(p + 0x0E) >> 0] = (cd_size >> 16) & 0xFF;
    U1[(p + 0x0F) >> 0] = (cd_size >> 24) & 0xFF;
    // Offset of cd wrt to starting disk
    U1[(p + 0x10) >> 0] = (cd_offset >>  0) & 0xFF;
    U1[(p + 0x11) >> 0] = (cd_offset >>  8) & 0xFF;
    U1[(p + 0x12) >> 0] = (cd_offset >> 16) & 0xFF;
    U1[(p + 0x13) >> 0] = (cd_offset >> 24) & 0xFF;
    // Comment len
    U1[(p + 0x14) >> 0] = 0x00;
    U1[(p + 0x15) >> 0] = 0x00;
  }

  return {
    crc32_make_crc_table: crc32_make_crc_table,
    crc32_crc: crc32_crc,
    zip_set_lfh: zip_set_lfh,
    zip_set_cdfh: zip_set_cdfh,
    zip_set_eocdr: zip_set_eocdr
  }
};
NCZip.prototype = {
  initialize: function () {
    this.fileEntries = [];
  },
  file: function(path, content, option) {
    if (option && option.base64) {
      content = atob(content);
    }

    var fileEntry = {
      path: path,
      content: content
    };
    if (typeof(content) === "string") {
      fileEntry.size = content.length;
    } else if (content instanceof ArrayBuffer) {
      fileEntry.size = content.byteLength;
    }

    this.fileEntries.push(fileEntry);
  },
  precaluculateOutputSize : function () {
    var fileLength = 0;
    for (var i = 0; i < this.fileEntries.length; i++) {
      var filePath = this.fileEntries[i].path;
      var fileContent = this.fileEntries[i].content;
      var fileSize = this.fileEntries[i].size;

      // Size of the Local file header
      fileLength += 30 + filePath.length;
      // Size of the file content
      fileLength += fileSize;
      // Size of the Central directory file header
      fileLength += 46 + filePath.length;
    }
    // End of central directory record
    fileLength += 22;

    return fileLength;
  },
  _memcpy_buffer: function(dst, dstOffset, src, srcOffset, size) {
    var dstU8 = new Uint8Array(dst, dstOffset, size);
    if ((src instanceof ArrayBuffer) || (src instanceof Array)) {
      var srcU8 = new Uint8Array(src, srcOffset, size);
      dstU8.set(srcU8);
    } else if (typeof(src) === "string") {
      for (var i = 0; i < size; i++) {
        dstU8[i] = src.charCodeAt(srcOffset + i);
      }
    } else {
      throw new Error("Invalid type");
    }
  },
  _getModule: function(stdlib, foreign, buffer) {
    var nczModuleAsmFunc = NCZip.NCZModuleAsmTemplate;
    var asmTemplate = NCZip.NCZModuleAsmTemplate.toString();
    if (!this.asmNoUse) {
      // Firefox-asm.js implementation issue:
      //
      // As a temporary limitation, modules cannot be linked more than once. ...
      // To work around this, compile a second module (e.g., using the Function constructor).
      if (asmTemplate.indexOf("asm template") > 0) {
        asmTemplate = asmTemplate.toString().replace('asm template', 'use asm');
        nczModuleAsmFunc = new Function("stdlib", "foreign", "buffer",
                                        asmTemplate +
                                        "\nreturn " + NCZip.NCZModuleAsmTemplate.name + "(stdlib, foreign, buffer)");
      }
    }
    return nczModuleAsmFunc(stdlib, foreign, buffer);
  },
  _build: function(options) {
    var bufferMap = {
      crc_table: 0, // 0..1023
      file_data: 2048
    };

    var fileLength = this.precaluculateOutputSize();
    var bufferLength = Math.max(4096, 1 << Math.ceil(Math.log2(fileLength + bufferMap.file_data)));
    var buffer = new ArrayBuffer(bufferLength);
    var u8 = new Uint8Array(buffer);

    var module = this._getModule({
      Uint8Array: Uint8Array,
      Int8Array: Int8Array,
      Uint16Array: Uint16Array,
      Int16Array: Int16Array,
      Uint32Array: Uint32Array,
      Int32Array: Int32Array,
      Float32Array: Float32Array,
      Float64Array: Float64Array,
      Math: Math
    }, {}, buffer);
    module.crc32_make_crc_table(bufferMap.crc_table);

    var p = bufferMap.file_data;
    // Local files
    var localFiles = new Array(this.fileEntries.length);
    for (var i = 0; i < this.fileEntries.length; i++) {
      var filePath = this.fileEntries[i].path;
      var fileHeaderLength = 30 + filePath.length;
      var fileSize = this.fileEntries[i].size;
      var fileBuffer = this.fileEntries[i].content;
      // file Content
      this._memcpy_buffer(buffer, p + fileHeaderLength,
                          fileBuffer, 0,
                          fileSize);
      // Calculate CRC
      var crc32 = module.crc32_crc(p + fileHeaderLength, fileSize, bufferMap.crc_table);
      // local file header
      module.zip_set_lfh(p, 0, 0, crc32, fileSize, filePath.length);
      // fileEntries Name
      for (var c = 0; c < filePath.length; c++) {
        u8[p + 30 + c] = filePath.charCodeAt(c);
      }

      localFiles[i] = { crc: crc32, offset: p - bufferMap.file_data };

      p += fileHeaderLength + fileSize;
    }
    // Central directory
    var p_cd = p;
    for (var i = 0; i < this.fileEntries.length; i++) {
      var filePath = this.fileEntries[i].path;
      var cdHeaderLength = 46 + filePath.length;
      var fileSize = this.fileEntries[i].size;
      var fileMod = 0; // TODO

      // Central directory
      module.zip_set_cdfh(p, 0, 0, localFiles[i].crc, fileSize, filePath.length, fileMod, localFiles[i].offset);
      // fileEntries Name
      for (var c = 0; c < filePath.length; c++) {
        u8[p + 46 + c] = filePath.charCodeAt(c);
      }

      p += cdHeaderLength;
    }
    // End of central directory record
    module.zip_set_eocdr(p, this.fileEntries.length, p - p_cd, p_cd - bufferMap.file_data);
    p += 22;

    return buffer.slice(bufferMap.file_data, p);
  },
  generate: function(options) {
    var data = this._build(options);

    if (options.type === "blob") {
      data = new Blob([data], {type: "application/zip" });
    } else if (options.type === "base64") {
      data = btoa(String.fromCharCode.apply(null, new Uint8Array(data)));
    }

    return data;
  }
}
