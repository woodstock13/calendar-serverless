"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typebox_1 = require("@sinclair/typebox");
// typeBox models bellow:
exports.CreatePlekEventInputs = typebox_1.Type.Object({
    plekerId: typebox_1.Type.Optional(typebox_1.Type.String({ format: 'email' })),
    plekId: typebox_1.Type.String(),
    start_date_iso_plek: typebox_1.Type.String(),
    end_date_iso_plek: typebox_1.Type.String(),
    fullAddress: typebox_1.Type.String(),
});
