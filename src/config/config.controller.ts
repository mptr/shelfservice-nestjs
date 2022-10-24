import { Controller } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';

@Controller('')
@Public()
export class ConfigController {}
