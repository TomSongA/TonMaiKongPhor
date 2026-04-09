"use client"

import Layout from '../../components/Layout'
import PredictionSection from '../../screens/Prediction'
import { useLiveSensors } from '../../hooks/useLiveSensors'
import DataTablePage from '../../screens/Prediction'
import { useCallback, useEffect, useState } from 'react'

export default function Page() {
    const sensors = useLiveSensors()
    const reading = sensors?.reading ?? null
    const history = sensors?.history ?? []

    return (
        <Layout>
            <PredictionSection reading={reading} history={history} initialHours={3} />
        </Layout>
        // <div className="page">
        //     <PredictionSection reading={reading} history={history} initialHours={3} />
        // </div>
    )
}
