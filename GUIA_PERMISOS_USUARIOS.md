# 🔧 Guía para Arreglar Permisos de Usuarios en Supabase

## 📋 Problema
Los usuarios no aparecen en la lista de usuarios del panel de administración debido a políticas RLS (Row Level Security) incorrectas.

## ✅ Solución

### Paso 1: Acceder al Editor SQL de Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **New Query**

### Paso 2: Ejecutar el Script de Permisos

1. Abre el archivo `FIX_PERMISOS_USUARIOS.sql`
2. Copia TODO el contenido del archivo
3. Pégalo en el editor SQL de Supabase
4. Haz clic en **Run** (o presiona Ctrl+Enter / Cmd+Enter)

**Resultado esperado:** Deberías ver un mensaje de éxito sin errores.

### Paso 3: Configurar tu Usuario como Superadmin

1. Abre el archivo `CONFIGURAR_SUPERADMIN.sql`
2. Copia la sección **"2. ACTUALIZAR USUARIO A SUPERADMIN"**:
   ```sql
   UPDATE public.profiles 
   SET 
       role = 'superadmin',
       is_active = true
   WHERE email = 'rauli3514@gmail.com';
   ```
3. Pégalo en el editor SQL de Supabase
4. Haz clic en **Run**

### Paso 4: Verificar que Funcionó

1. Copia esta consulta:
   ```sql
   SELECT id, email, role, is_active 
   FROM public.profiles 
   ORDER BY created_at DESC;
   ```
2. Ejecútala en el editor SQL
3. Deberías ver tu usuario con `role = 'superadmin'`

### Paso 5: Probar en la Aplicación

1. Cierra sesión en la aplicación (si estás logueado)
2. Vuelve a iniciar sesión con `rauli3514@gmail.com`
3. Ve a **Dashboard → Usuarios**
4. Ahora deberías ver todos los usuarios

## 🔍 Verificación Adicional

Si aún no ves usuarios, ejecuta esta consulta para verificar:

```sql
SELECT 
    p.email,
    p.role,
    p.is_active,
    COUNT(e.id) as eventos_propios
FROM public.profiles p
LEFT JOIN public.events e ON e.owner_id = p.id
GROUP BY p.id, p.email, p.role, p.is_active
ORDER BY p.created_at DESC;
```

## 📝 Qué Hace el Script

### Políticas Nuevas:

1. **SELECT (Ver usuarios):**
   - ✅ Superadmins pueden ver TODOS los usuarios
   - ✅ Providers solo ven su propio perfil

2. **UPDATE (Actualizar usuarios):**
   - ✅ Superadmins pueden actualizar cualquier usuario
   - ✅ Providers solo pueden actualizar su propio perfil

3. **DELETE (Eliminar usuarios):**
   - ✅ Solo superadmins pueden eliminar usuarios

4. **INSERT (Crear usuarios):**
   - ✅ Se crea automáticamente al registrarse (trigger)

### Mejoras en Eventos:

- ✅ Superadmins ven todos los eventos
- ✅ Owners ven sus propios eventos
- ✅ Providers ven eventos asignados a ellos

## ⚠️ Notas Importantes

- **Backup:** Supabase guarda un historial automático, pero es buena práctica hacer backup antes de cambios importantes
- **Usuarios Existentes:** El script NO elimina usuarios existentes, solo actualiza permisos
- **Primer Superadmin:** Debes tener al menos un usuario registrado antes de ejecutar el script

## 🆘 Solución de Problemas

### Error: "role 'superadmin' does not exist"
El tipo de dato ya existe, ignora este error.

### No aparecen usuarios después del script
1. Verifica que estés logueado como superadmin
2. Abre la consola del navegador (F12) y busca errores
3. Ejecuta la consulta de verificación del Paso 4

### Error de permisos al ejecutar el script
Asegúrate de estar usando el editor SQL de Supabase con permisos de administrador del proyecto.

## 📞 Soporte

Si sigues teniendo problemas, revisa:
1. Los logs en la consola del navegador (F12)
2. Los logs del servidor en Supabase → Logs
3. Las políticas RLS en Supabase → Authentication → Policies
