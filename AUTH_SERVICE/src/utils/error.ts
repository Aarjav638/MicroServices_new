export class ApiError extends Error {
    status_code:number
    name:string
    constructor(message:string,status_code:number,name:string) {
        super(message)
        this.status_code=status_code
        this.name=name
    }
}