export class ApiError extends Error {
    public status: number;
    public data: unknown;

    constructor(status: number, data: unknown, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

const baseUrl = "http://localhost:5296";

const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
};

async function parseResponse(response: Response) {
    const text = await response.text();
    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export async function fetchJson<T>(input: string, init: RequestInit = {}): Promise<T> {
    const url = input.startsWith("http") ? input : `${baseUrl}${input}`;
    const response = await fetch(url, {
        credentials: "include",
        headers: {
            ...defaultHeaders,
            ...init.headers,
        },
        ...init,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new ApiError(response.status, data, typeof data === "string" ? data : response.statusText);
    }

    return data as T;
}

export async function postJson<T>(input: string, body: unknown, init: RequestInit = {}): Promise<T> {
    return fetchJson<T>(input, {
        method: "POST",
        body: JSON.stringify(body),
        ...init,
    });
}
