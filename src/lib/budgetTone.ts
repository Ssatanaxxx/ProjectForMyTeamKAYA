export type BudgetTone = 'danger' | 'warning' | 'brand'

export const getUtilizationTone = (overLimit: boolean, utilization: number): BudgetTone => {
    
    if (overLimit) {
        return 'danger'
    }

    if (utilization > 85) {
        return 'warning'
    }

    return 'brand'
}