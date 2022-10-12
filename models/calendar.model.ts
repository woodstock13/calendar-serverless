import { Static, Type } from '@sinclair/typebox'

export interface DayAvailabilities {
    availibilties: number
    totalBookedPleks: number
    plekersEmail: string[]
}

// typeBox models bellow:

export const CreatePlekEventInputs = Type.Object({
    plekerId: Type.Optional(Type.String({ format: 'email' })),
    plekId: Type.String(),
    start_date_iso_plek: Type.String(),
    end_date_iso_plek: Type.String(),
    fullAddress: Type.String(),
})

export type CreatePlekEventInputsType = Static<typeof CreatePlekEventInputs>