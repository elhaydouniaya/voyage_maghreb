from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers.trips import router as trips_router
from backend.routers.agencies import router as agencies_router
from backend.routers.bookings import router as bookings_router
from backend.routers.admin import router as admin_router

app = FastAPI(
    title="Maghreb Travel API",
    description="Backend FastAPI pour la plateforme Maghreb Travel",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — autorise le frontend Next.js à appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(trips_router)
app.include_router(agencies_router)
app.include_router(bookings_router)
app.include_router(admin_router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "Maghreb Travel FastAPI Backend",
        "version": "1.0.0",
        "docs": "/docs",
    }
